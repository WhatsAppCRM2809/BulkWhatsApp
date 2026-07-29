import { Injectable, signal, computed } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ContactPhoneItem {
  id?: number;
  phoneNumber: string;
  phoneLabel: string;
  hasWhatsApp: boolean;
  isPrimary: boolean;
  isValid: boolean;
}

export interface FinancialContact {
  id: string;
  ctaBt: string;
  doc?: string;
  nombreCompleto: string;
  primerNombre: string;
  nombres: string;
  apellidoPaterno: string;
  direccion?: string;
  distrito?: string;
  departamento?: string;
  telefonoT1: string;
  telefonoT2: string;
  telefonoValido: string;
  hasWhatsApp: boolean;
  phones?: ContactPhoneItem[];
  customAttributes?: Record<string, any>;
  producto?: string;
  oferta?: number;
  tasa?: number;
  plazo?: number;
  agencia?: string;
  campana?: string;
  propension?: string | number;
  edad?: number;
  combo?: string;
  estado: 'Pendiente' | 'Enviado' | 'Fallido' | 'Interesado' | 'Sin Telefono';
  importedAt: string;
}

const STORAGE_KEY = 'crm_financial_contacts_v1';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  public allContacts = signal<FinancialContact[]>([]);
  public isProcessing = signal<boolean>(false);
  public importMode = signal<'overwrite' | 'append' | 'replace'>('overwrite');

  public validContacts = signal<FinancialContact[]>([]);
  public invalidContacts = signal<FinancialContact[]>([]);
  public selectedContact = signal<FinancialContact | null>(null);

  public totalRecords = computed(() => this.allContacts().length);
  public validWhatsAppCount = computed(() => this.validContacts().length);
  public invalidCount = computed(() => this.invalidContacts().length);

  constructor() {
    this.loadSavedState();
  }

  private loadSavedState(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: FinancialContact[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.updateState(parsed);
          return;
        }
      } catch (e) {
        console.warn('Could not parse stored contacts, starting clean.');
      }
    }
    // Clean initial state (no mock data)
    this.updateState([]);
  }

  private updateState(contacts: FinancialContact[]): void {
    this.allContacts.set(contacts);

    const valid = contacts.filter(c => c.hasWhatsApp);
    const invalid = contacts.filter(c => !c.hasWhatsApp);

    this.validContacts.set(valid);
    this.invalidContacts.set(invalid);

    if (valid.length > 0 && !this.selectedContact()) {
      this.selectedContact.set(valid[0]);
    } else if (valid.length === 0) {
      this.selectedContact.set(null);
    }

    try {
      // Only serialize to localStorage if under 2000 items to avoid blocking UI thread on large Excels (66k+ rows)
      if (contacts.length <= 2000) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('LocalStorage limit reached or skipped for performance:', e);
    }
  }

  /**
   * Adds a manually registered contact
   */
  public addManualContact(form: {
    nombre: string;
    telefono: string;
    ctaBt?: string;
    doc?: string;
    producto?: string;
    oferta?: number;
    tasa?: number;
    plazo?: number;
    agencia?: string;
    distrito?: string;
    propension?: string | number;
  }): FinancialContact {
    const rawName = form.nombre.trim();
    const nameParsed = this.cleanAndSplitName(rawName);

    const rawPhone = form.telefono.trim();
    const validPhone = this.normalizePhoneCascade(rawPhone, '');
    const hasWA = validPhone.length >= 9;

    const newContact: FinancialContact = {
      id: `MANUAL-${Date.now()}`,
      ctaBt: form.ctaBt?.trim() || `MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      doc: form.doc?.trim() || '',
      nombreCompleto: nameParsed.fullTitleCase,
      primerNombre: nameParsed.primerNombre,
      nombres: nameParsed.nombres,
      apellidoPaterno: nameParsed.apellidoPaterno,
      distrito: form.distrito?.trim() || '',
      telefonoT1: rawPhone,
      telefonoT2: '',
      telefonoValido: validPhone,
      hasWhatsApp: hasWA,
      producto: form.producto || 'Préstamo Personal',
      oferta: form.oferta || 10000,
      tasa: form.tasa || 35.0,
      plazo: form.plazo || 12,
      agencia: form.agencia || 'Agencia Principal',
      campana: 'Registro Manual CRM',
      propension: form.propension || 'Alto',
      estado: hasWA ? 'Pendiente' : 'Sin Telefono',
      importedAt: new Date().toLocaleTimeString()
    };

    const updated = [newContact, ...this.allContacts()];
    this.updateState(updated);
    this.selectedContact.set(newContact);

    return newContact;
  }

  /**
   * Parses Excel / CSV files and maps columns dynamically
   */
  public parseExcelFile(file: File): void {
    this.isProcessing.set(true);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // First check if file has header row by reading raw array of arrays
        const matrixRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (matrixRows.length === 0) {
          this.isProcessing.set(false);
          return;
        }

        const firstRow = matrixRows[0];
        const firstRowStr = firstRow.map(cell => String(cell).toUpperCase().trim()).join(' ');

        // Check if first row contains header keywords
        const hasHeaders = ['DOC', 'DNI', 'CTA', 'NOMBRE', 'PRODUCTO', 'T1', 'OFERTA', 'TASA', 'PROPENSION', 'AGENCIA']
          .some(keyword => firstRowStr.includes(keyword));

        let newParsedContacts: FinancialContact[] = [];

        if (hasHeaders) {
          // Standard Header-Based Parsing
          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          newParsedContacts = jsonRows.map((row, index) => {
            const rawName = String(row['NOMBRE'] || row['Cliente'] || row['Nombre'] || row['NOMBRES'] || 'Cliente');
            const nameParsed = this.cleanAndSplitName(rawName);

            const rawT1 = String(row['T1'] || row['Telefono'] || row['TELEFONO'] || row['Celular'] || '');
            const rawT2 = String(row['T2'] || row['Telefono2'] || row['TELEFONO2'] || row['Celular2'] || '');
            const rawT3 = String(row['T3'] || row['Telefono3'] || row['TELEFONO3'] || row['Celular3'] || '');
            const rawT4 = String(row['T4'] || row['Telefono4'] || row['TELEFONO4'] || row['Celular4'] || '');

            const validPhone = this.normalizePhoneCascade(rawT1, rawT2, rawT3, rawT4);
            const hasWA = validPhone.length >= 9;

            // Capture all dynamic headers into customAttributes
            const customAttributes: Record<string, any> = {};
            Object.keys(row).forEach(key => {
              if (row[key] !== undefined && row[key] !== null) {
                customAttributes[key.trim()] = row[key];
              }
            });

            // Build normalized phone list according to Option B Best Practice
            const phones: ContactPhoneItem[] = [];
            if (validPhone) {
              phones.push({ phoneNumber: validPhone, phoneLabel: 'PRIMARY', hasWhatsApp: hasWA, isPrimary: true, isValid: true });
            }
            if (rawT1 && rawT1 !== validPhone) {
              phones.push({ phoneNumber: rawT1, phoneLabel: 'T1', hasWhatsApp: false, isPrimary: false, isValid: true });
            }
            if (rawT2 && rawT2 !== validPhone) {
              phones.push({ phoneNumber: rawT2, phoneLabel: 'T2', hasWhatsApp: false, isPrimary: false, isValid: true });
            }
            if (rawT3 && rawT3 !== validPhone) {
              phones.push({ phoneNumber: rawT3, phoneLabel: 'T3', hasWhatsApp: false, isPrimary: false, isValid: true });
            }

            return {
              id: `CNT-${Date.now()}-${index}`,
              ctaBt: String(row['CTA BT'] || row['CtaBt'] || row['CUENTA'] || `AUT-${index}`),
              doc: String(row['DOC'] || row['Doc'] || row['DNI'] || row['Dni'] || ''),
              nombreCompleto: nameParsed.fullTitleCase,
              primerNombre: nameParsed.primerNombre,
              nombres: nameParsed.nombres,
              apellidoPaterno: nameParsed.apellidoPaterno,
              direccion: String(row['DIRECCION'] || row['Direccion'] || ''),
              distrito: String(row['DISTRITO'] || row['Distrito'] || ''),
              departamento: String(row['DEPARTAMENTO'] || row['Departamento'] || ''),
              telefonoT1: rawT1,
              telefonoT2: rawT2,
              telefonoValido: validPhone,
              hasWhatsApp: hasWA,
              phones,
              customAttributes,
              producto: String(row['PRODUCTO'] || row['Producto'] || 'Préstamo Personal'),
              oferta: Number(row['OFERTA'] || row['Oferta'] || row['MONTO'] || 15000),
              tasa: Number(row['TASA'] || row['Tasa'] || 39.5),
              plazo: Number(row['PLAZOMIN'] || row['PLAZO'] || row['Plazo'] || 12),
              agencia: String(row['AGENCIA'] || row['Agencia'] || 'Agencia Principal'),
              campana: String(row['NOMB_CAMPAÑA'] || row['CAMPAÑA'] || `Campaña ${file.name}`),
              propension: row['PROPENSION'] !== undefined && row['PROPENSION'] !== '' ? row['PROPENSION'] : (row['Propension'] || ''),
              edad: Number(row['EDAD'] || row['Edad'] || 0),
              combo: String(row['COMBO'] || row['Combo'] || ''),
              estado: hasWA ? 'Pendiente' : 'Sin Telefono',
              importedAt: new Date().toLocaleTimeString()
            };
          });
        } else {
          // Positional Headerless Parsing (Standard Bank Structure)
          newParsedContacts = matrixRows.map((rowArr, index) => {
            const rawName = String(rowArr[2] || rowArr[1] || 'Cliente');
            const nameParsed = this.cleanAndSplitName(rawName);

            const rawT1 = String(rowArr[6] || rowArr[5] || '');
            const rawT2 = String(rowArr[7] || '');
            const rawT3 = String(rowArr[8] && String(rowArr[8]).startsWith('9') ? rowArr[8] : '');

            const validPhone = this.normalizePhoneCascade(rawT1, rawT2, rawT3);
            const hasWA = validPhone.length >= 9;

            return {
              id: `CNT-${Date.now()}-${index}`,
              doc: String(rowArr[0] || ''),
              ctaBt: String(rowArr[1] || `AUT-${index}`),
              nombreCompleto: nameParsed.fullTitleCase,
              primerNombre: nameParsed.primerNombre,
              nombres: nameParsed.nombres,
              apellidoPaterno: nameParsed.apellidoPaterno,
              direccion: String(rowArr[3] || ''),
              distrito: String(rowArr[4] || ''),
              departamento: String(rowArr[5] || ''),
              telefonoT1: rawT1,
              telefonoT2: rawT2,
              telefonoValido: validPhone,
              hasWhatsApp: hasWA,
              producto: String(rowArr[8] || 'Préstamo Personal'),
              oferta: Number(rowArr[9] || 15000),
              tasa: Number(rowArr[10] || 39.5),
              plazo: Number(rowArr[11] || 12),
              combo: String(rowArr[12] || ''),
              campana: String(rowArr[13] || `Campaña ${file.name}`),
              propension: rowArr[14] !== undefined && rowArr[14] !== null ? String(rowArr[14]) : '',
              edad: Number(rowArr[15] || 0),
              agencia: String(rowArr[16] || 'Agencia Principal'),
              estado: hasWA ? 'Pendiente' : 'Sin Telefono',
              importedAt: new Date().toLocaleTimeString()
            };
          });
        }

        let finalContacts: FinancialContact[] = [];

        if (this.importMode() === 'append') {
          const existingMap = new Map<string, FinancialContact>();
          this.allContacts().forEach(c => existingMap.set(c.ctaBt, c));

          newParsedContacts.forEach(c => {
            existingMap.set(c.ctaBt, c);
          });

          finalContacts = Array.from(existingMap.values());
        } else {
          finalContacts = newParsedContacts;
        }

        this.updateState(finalContacts);
      } catch (err) {
        console.error('Error parsing Excel:', err);
      } finally {
        this.isProcessing.set(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Exports any array of contacts to a downloadable .xlsx Excel file
   */
  public exportContactsToExcel(contacts: FinancialContact[], fileName: string = 'Reporte_Contactos_CRM.xlsx'): void {
    if (!contacts || contacts.length === 0) return;

    const dataToExport = contacts.map(c => ({
      'DOC': c.doc || '',
      'CTA BT': c.ctaBt,
      'NOMBRE COMPLETO': c.nombreCompleto,
      'TELEFONO VÁLIDO': c.telefonoValido,
      'PROPENSION': c.propension ?? '',
      'ESTADO ENVÍO': c.estado,
      'PRODUCTO': c.producto,
      'OFERTA (S/)': c.oferta,
      'TASA (%)': c.tasa,
      'PLAZO (MESES)': c.plazo,
      'DISTRITO': c.distrito || '',
      'DEPARTAMENTO': c.departamento || '',
      'AGENCIA': c.agencia,
      'CAMPAÑA': c.campana,
      'REGISTRADO': c.importedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Clears saved database reset to empty state
   */
  public clearDatabase(): void {
    this.allContacts.set([]);
    this.validContacts.set([]);
    this.invalidContacts.set([]);
    this.selectedContact.set(null);
    setTimeout(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }, 0);
  }

  /**
   * Title-cases name and extracts primerNombre, nombres, and apellidoPaterno
   */
  public cleanAndSplitName(rawName: string): { fullTitleCase: string; primerNombre: string; nombres: string; apellidoPaterno: string } {
    if (!rawName) return { fullTitleCase: 'Cliente', primerNombre: 'Cliente', nombres: 'Cliente', apellidoPaterno: '' };

    const words = rawName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const fullTitleCase = words.join(' ');
    
    const primerNombre = words[0] || 'Cliente';
    const nombres = words.length > 2 ? `${words[0]} ${words[1]}` : primerNombre;
    const apellidoPaterno = words.length >= 3 ? words[2] : (words[1] || '');

    return { fullTitleCase, primerNombre, nombres, apellidoPaterno };
  }

  /**
   * Checks candidate phone numbers in sequence (T1 -> T2 -> T3 -> T4), returning the first valid 9-digit Peruvian mobile
   */
  public normalizePhoneCascade(...candidatePhones: string[]): string {
    const isValidPeruvianCell = (p: string) => (p.length === 9 && p.startsWith('9')) || (p.length === 11 && p.startsWith('519'));

    for (const phoneStr of candidatePhones) {
      if (!phoneStr) continue;
      const clean = String(phoneStr).replace(/\D/g, '');
      if (isValidPeruvianCell(clean)) {
        return clean.length === 9 ? `51${clean}` : clean;
      }
    }

    // Fallback if no 9-digit cell found, return first non-empty clean number
    for (const phoneStr of candidatePhones) {
      if (!phoneStr) continue;
      const clean = String(phoneStr).replace(/\D/g, '');
      if (clean.length >= 7) {
        return clean.length === 9 ? `51${clean}` : clean;
      }
    }

    return '';
  }
}
