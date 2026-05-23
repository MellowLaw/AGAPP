import { generateServiceRequestPDF } from './pdf-generator';
import * as fs from 'fs';
import * as path from 'path';

async function generateSamplePDFs() {
  const outputDir = path.join(__dirname, '..', 'sample-forms');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Sample 1: Birth Certificate Request
  console.log('Generating Birth Certificate PDF...');
  const birthCertPDF = await generateServiceRequestPDF({
    referenceNumber: 'REQ-2026-0001',
    citizenName: 'Lawrence Dayzero',
    serviceType: 'Birth Certificate Request',
    officeName: 'Civil Registrar',
    formDetails: {
      fullName: 'Lawrence Dayzero',
      birthDate: '2003-08-15',
      placeOfBirth: 'Liliw District Hospital',
      fatherName: 'Benjamin Alcantara',
      motherName: 'Lina Alcantara',
      purpose: 'Employment Requirement',
    },
    lguName: 'Municipality of Liliw',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0001',
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(path.join(outputDir, 'sample-birth-certificate.pdf'), birthCertPDF);

  // Sample 2: Business Permit Renewal
  console.log('Generating Business Permit PDF...');
  const businessPDF = await generateServiceRequestPDF({
    referenceNumber: 'REQ-2026-0002',
    citizenName: 'Lawrence Dayzero',
    serviceType: 'Business Permit Renewal',
    officeName: 'BPLO',
    formDetails: {
      businessName: 'LBA Web Solutions & Tech Services',
      ownerName: 'Lawrence Dayzero',
      lineOfBusiness: 'Information Technology Services',
      barangay: 'Poblacion',
      capitalization: '150000',
    },
    lguName: 'Municipality of Liliw',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0002',
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(path.join(outputDir, 'sample-business-permit.pdf'), businessPDF);

  // Sample 3: Barangay Clearance
  console.log('Generating Barangay Clearance PDF...');
  const barangayPDF = await generateServiceRequestPDF({
    referenceNumber: 'REQ-2026-0003',
    citizenName: 'Maria Santos',
    serviceType: 'Barangay Clearance',
    officeName: 'Barangay Poblacion',
    formDetails: {
      fullName: 'Maria Santos',
      birthDate: '1995-03-20',
      placeOfBirth: 'Liliw, Laguna',
      civilStatus: 'Single',
      residency: '5 years',
      purpose: 'Employment Abroad',
    },
    lguName: 'Municipality of Liliw',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0003',
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(path.join(outputDir, 'sample-barangay-clearance.pdf'), barangayPDF);

  // Sample 4: Cedula
  console.log('Generating Cedula PDF...');
  const cedulaPDF = await generateServiceRequestPDF({
    referenceNumber: 'REQ-2026-0004',
    citizenName: 'Jose Dela Cruz',
    serviceType: 'Cedula / Community Tax Certificate',
    officeName: 'Municipal Treasurer',
    formDetails: {
      fullName: 'Jose Dela Cruz',
      tin: '123-456-789-000',
      height: '170 cm',
      weight: '65 kg',
      grossIncome: '₱120,000',
    },
    lguName: 'Municipality of Liliw',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REQ-2026-0004',
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(path.join(outputDir, 'sample-cedula.pdf'), cedulaPDF);

  console.log('\n✅ Sample PDFs generated successfully!');
  console.log(`📁 Location: ${outputDir}`);
  console.log('\nGenerated files:');
  console.log('  - sample-birth-certificate.pdf');
  console.log('  - sample-business-permit.pdf');
  console.log('  - sample-barangay-clearance.pdf');
  console.log('  - sample-cedula.pdf');
}

generateSamplePDFs().catch(console.error);
