import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';

export interface FinancialContact {
  id: string;
  ctaBt: string;
  nombreCompleto: string;
  primerNombre: string;
  nombres: string;
  apellidoPaterno: string;
  telefonoT1: string;
  telefonoT2: string;
  telefonoValido: string;
  hasWhatsApp: boolean;
  producto: string;
  oferta: number;
  tasa: number;
  plazo: number;
  agencia: string;
  campana: string;
  estado: 'Pendiente' | 'Enviado' | 'Interesado' | 'Fallido' | 'Sin Telefono';
  fechaEnvio?: string;
  importedAt?: string;
}

const STORAGE_KEY = 'bulk_whatsapp_crm_contacts_v1';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  public allContacts = signal<FinancialContact[]>([]);
  public validContacts = signal<FinancialContact[]>([]);
  public invalidContacts = signal<FinancialContact[]>([]);
  public selectedContact = signal<FinancialContact | null>(null);
  public isProcessing = signal<boolean>(false);
  public importMode = signal<'append' | 'replace'>('append'); // default to incremental append!

  constructor() {
    this.loadFromStorage();
  }

  public selectContact(contact: FinancialContact): void {
    this.selectedContact.set(contact);
  }

  /**
   * Loads saved contacts database from LocalStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const contacts: FinancialContact[] = JSON.parse(stored);
        if (contacts && contacts.length > 0) {
          this.updateState(contacts);
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage error, fallback to mock data:', e);
    }
    // Fallback to initial mock dataset if storage is empty
    this.loadMockData();
  }

  /**
   * Saves contacts array to LocalStorage
   */
  private saveToStorage(contacts: FinancialContact[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error('Error saving to LocalStorage:', e);
    }
  }

  /**
   * Updates internal signals and selected contact
   */
  private updateState(contacts: FinancialContact[]): void {
    this.allContacts.set(contacts);
    const valids = contacts.filter(c => c.hasWhatsApp);
    this.validContacts.set(valids);
    this.invalidContacts.set(contacts.filter(c => !c.hasWhatsApp));

    if (valids.length > 0 && !this.selectedContact()) {
      this.selectedContact.set(valids[0]);
    }
    this.saveToStorage(contacts);
  }

  /**
   * Reads raw Excel file and handles INCREMENTAL APPEND vs REPLACE
   */
  public async parseExcelFile(file: File): Promise<void> {
    this.isProcessing.set(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const newParsedContacts: FinancialContact[] = rawRows.map((row, index) => {
        const rawName = String(row['NOMBRE'] || row['Nombre'] || row['CLIENTE'] || 'CLIENTE S/N').trim();
        const nameParsed = this.cleanAndSplitName(rawName);
        
        const rawT1 = String(row['T1'] || row['TEL1'] || row['TELEFONO1'] || '').trim();
        const rawT2 = String(row['T2'] || row['TEL2'] || row['TELEFONO2'] || '').trim();
        
        const validPhone = this.normalizePhoneCascade(rawT1, rawT2);
        const hasWA = validPhone.length >= 9;

        return {
          id: `CNT-${Date.now()}-${index + 1}`,
          ctaBt: String(row['CTA BT'] || row['CTA_BT'] || row['CUENTA'] || `CTA-${1000 + index}`),
          nombreCompleto: nameParsed.fullTitleCase,
          primerNombre: nameParsed.primerNombre,
          nombres: nameParsed.nombres,
          apellidoPaterno: nameParsed.apellidoPaterno,
          telefonoT1: rawT1,
          telefonoT2: rawT2,
          telefonoValido: validPhone,
          hasWhatsApp: hasWA,
          producto: String(row['PRODUCTO'] || row['Producto'] || 'Préstamo Personal'),
          oferta: Number(row['OFERTA'] || row['Oferta'] || row['MONTO'] || 15000),
          tasa: Number(row['TASA'] || row['Tasa'] || 39.5),
          plazo: Number(row['PLAZO'] || row['Plazo'] || 12),
          agencia: String(row['AGENCIA'] || row['Agencia'] || 'Agencia Principal'),
          campana: String(row['NOMB_CAMPAÑA'] || row['CAMPAÑA'] || `Campaña ${file.name}`),
          estado: hasWA ? 'Pendiente' : 'Sin Telefono',
          importedAt: new Date().toLocaleTimeString()
        };
      });

      let finalContacts: FinancialContact[] = [];

      if (this.importMode() === 'append') {
        // Deduplicate by CTA BT if contact already exists, update offer, else append!
        const existingMap = new Map<string, FinancialContact>();
        this.allContacts().forEach(c => existingMap.set(c.ctaBt, c));

        newParsedContacts.forEach(c => {
          existingMap.set(c.ctaBt, c); // inserts or updates existing account!
        });

        finalContacts = Array.from(existingMap.values());
      } else {
        // Replace current list entirely
        finalContacts = newParsedContacts;
      }

      this.updateState(finalContacts);
    } catch (err) {
      console.error('Error parsing Excel:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Clears saved database reset to empty state
   */
  public clearDatabase(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.allContacts.set([]);
    this.validContacts.set([]);
    this.invalidContacts.set([]);
    this.selectedContact.set(null);
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
   * Checks T1 first, then T2, ensuring Peru 9-digit format (adds 51 prefix)
   */
  private normalizePhoneCascade(t1: string, t2: string): string {
    const cleanT1 = t1.replace(/\D/g, '');
    const cleanT2 = t2.replace(/\D/g, '');

    const isValidPeruvianCell = (p: string) => (p.length === 9 && p.startsWith('9')) || (p.length === 11 && p.startsWith('519'));

    if (isValidPeruvianCell(cleanT1)) {
      return cleanT1.length === 9 ? `51${cleanT1}` : cleanT1;
    }
    if (isValidPeruvianCell(cleanT2)) {
      return cleanT2.length === 9 ? `51${cleanT2}` : cleanT2;
    }
    return '';
  }

  /**
   * Generates mock data if no Excel is loaded yet
   */
  public loadMockData(): void {
    const mockRaw = [
      { 'CTA BT': '45812901', NOMBRE: 'JULIO CESAR TOICAL', T1: '961061471', T2: '', PRODUCTO: 'ET Tarjeta', OFERTA: 17500, TASA: 41.5, PLAZO: 12, AGENCIA: 'LA ALAMEDA', NOMB_CAMPAÑA: 'Campaña Efectivo Alto' },
      { 'CTA BT': '45812902', NOMBRE: 'MARIA ELENA ROSALES', T1: '984512049', T2: '912384910', PRODUCTO: 'Préstamo Libre', OFERTA: 25000, TASA: 35.0, PLAZO: 24, AGENCIA: 'SAN ISIDRO', NOMB_CAMPAÑA: 'Campaña Efectivo Alto' },
      { 'CTA BT': '45812903', NOMBRE: 'CARLOS ALBERTO MENDOZA', T1: '', T2: '', PRODUCTO: 'ET Tarjeta', OFERTA: 12000, TASA: 45.0, PLAZO: 18, AGENCIA: 'MIRAFLORES', NOMB_CAMPAÑA: 'Campaña Efectivo Alto' },
      { 'CTA BT': '45812904', NOMBRE: 'ANA LUCIA GUTIERREZ', T1: '978120394', T2: '', PRODUCTO: 'Préstamo Auto', OFERTA: 38000, TASA: 29.9, PLAZO: 36, AGENCIA: 'SURCO', NOMB_CAMPAÑA: 'Campaña Efectivo Alto' },
      { 'CTA BT': '45812905', NOMBRE: 'ROBERTO GONZALES VIGIL', T1: '910293847', T2: '', PRODUCTO: 'ET Tarjeta', OFERTA: 9500, TASA: 48.0, PLAZO: 6, AGENCIA: 'LA ALAMEDA', NOMB_CAMPAÑA: 'Campaña Efectivo Alto' }
    ];

    const mockContacts: FinancialContact[] = mockRaw.map((row, index) => {
      const nameParsed = this.cleanAndSplitName(row.NOMBRE);
      const validPhone = this.normalizePhoneCascade(row.T1, row.T2);
      const hasWA = validPhone.length >= 9;

      return {
        id: `CNT-MOCK-${index + 1}`,
        ctaBt: row['CTA BT'],
        nombreCompleto: nameParsed.fullTitleCase,
        primerNombre: nameParsed.primerNombre,
        nombres: nameParsed.nombres,
        apellidoPaterno: nameParsed.apellidoPaterno,
        telefonoT1: row.T1,
        telefonoT2: row.T2,
        telefonoValido: validPhone,
        hasWhatsApp: hasWA,
        producto: row.PRODUCTO,
        oferta: row.OFERTA,
        tasa: row.TASA,
        plazo: row.PLAZO,
        agencia: row.AGENCIA,
        campana: row.NOMB_CAMPAÑA,
        estado: hasWA ? 'Pendiente' : 'Sin Telefono',
        importedAt: 'Inicial'
      };
    });

    this.updateState(mockContacts);
  }
}
