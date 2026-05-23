import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

export interface FormData {
  referenceNumber: string;
  citizenName: string;
  serviceType: string;
  officeName: string;
  formDetails: Record<string, string>;
  lguName: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export async function generateServiceRequestPDF(data: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Colors
  const primaryColor = rgb(0.635, 0.714, 0.624); // #A2B59F
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  
  let y = height - 50;
  
  // Header Box
  page.drawRectangle({
    x: 50,
    y: y - 80,
    width: width - 100,
    height: 70,
    color: primaryColor,
    borderWidth: 2,
    borderColor: black,
  });
  
  // LGU Header
  page.drawText('REPUBLIC OF THE PHILIPPINES', {
    x: width / 2 - 100,
    y: y - 20,
    size: 10,
    font,
    color: black,
  });
  
  page.drawText(data.lguName.toUpperCase(), {
    x: width / 2 - 80,
    y: y - 38,
    size: 14,
    font: boldFont,
    color: black,
  });
  
  page.drawText('PROVINCE OF LAGUNA', {
    x: width / 2 - 60,
    y: y - 55,
    size: 10,
    font,
    color: black,
  });
  
  y -= 100;
  
  // Form Title
  const formTitle = getFormTitle(data.serviceType);
  page.drawText(formTitle, {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: black,
  });
  
  y -= 30;
  
  // Reference Number Box
  page.drawRectangle({
    x: width - 220,
    y: y - 5,
    width: 170,
    height: 35,
    borderWidth: 1,
    borderColor: black,
  });
  
  page.drawText('Reference Number:', {
    x: width - 210,
    y: y + 10,
    size: 9,
    font,
    color: gray,
  });
  
  page.drawText(data.referenceNumber, {
    x: width - 210,
    y: y - 8,
    size: 12,
    font: boldFont,
    color: black,
  });
  
  // QR Code placeholder
  if (data.qrCodeUrl) {
    page.drawRectangle({
      x: width - 210,
      y: y - 100,
      width: 80,
      height: 80,
      borderWidth: 1,
      borderColor: gray,
    });
    page.drawText('[QR CODE]', {
      x: width - 195,
      y: y - 55,
      size: 8,
      font,
      color: gray,
    });
  }
  
  y -= 20;
  
  // Date
  page.drawText(`Date Filed: ${new Date(data.createdAt).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, {
    x: 50,
    y,
    size: 11,
    font,
    color: black,
  });
  
  y -= 40;
  
  // Personal Information Section
  page.drawText('PERSONAL INFORMATION', {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });
  
  y -= 25;
  
  // Draw form fields based on service type
  const fields = getFormFields(data.serviceType, data.formDetails);
  
  for (const field of fields) {
    // Label
    page.drawText(field.label + ':', {
      x: 50,
      y,
      size: 10,
      font,
      color: gray,
    });
    
    // Value
    page.drawText(field.value || '_________________', {
      x: 200,
      y,
      size: 11,
      font: boldFont,
      color: black,
    });
    
    // Underline
    if (!field.value) {
      page.drawLine({
        start: { x: 200, y: y - 2 },
        end: { x: width - 250, y: y - 2 },
        thickness: 1,
        color: gray,
      });
    }
    
    y -= 25;
  }
  
  y -= 20;
  
  // Declaration
  page.drawText('DECLARATION', {
    x: 50,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });
  
  y -= 20;
  
  const declarationText = `I, ${data.citizenName}, hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that any false statement may result in the denial of this request or legal action as prescribed by law.`;
  
  const words = declarationText.split(' ');
  let line = '';
  const maxWidth = width - 150;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, 10);
    
    if (testWidth > maxWidth && line !== '') {
      page.drawText(line, {
        x: 50,
        y,
        size: 10,
        font,
        color: black,
      });
      y -= 15;
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  
  if (line !== '') {
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font,
      color: black,
    });
  }
  
  y -= 50;
  
  // Signature section
  page.drawLine({
    start: { x: 50, y },
    end: { x: 250, y },
    thickness: 1,
    color: black,
  });
  
  page.drawText('Signature of Applicant', {
    x: 50,
    y: y - 15,
    size: 10,
    font,
    color: gray,
  });
  
  page.drawText(data.citizenName, {
    x: 50,
    y: y - 28,
    size: 10,
    font,
    color: black,
  });
  
  // Office Use Only Section
  y -= 80;
  
  page.drawRectangle({
    x: 50,
    y: y - 120,
    width: width - 100,
    height: 110,
    borderWidth: 1,
    borderColor: gray,
  });
  
  page.drawText('FOR OFFICE USE ONLY', {
    x: width / 2 - 60,
    y: y - 15,
    size: 11,
    font: boldFont,
    color: black,
  });
  
  page.drawText(`Office: ${data.officeName}`, {
    x: 60,
    y: y - 40,
    size: 10,
    font,
    color: black,
  });
  
  page.drawText('Received by: _________________________', {
    x: 60,
    y: y - 60,
    size: 10,
    font,
    color: black,
  });
  
  page.drawText('Date Received: _________________________', {
    x: 60,
    y: y - 80,
    size: 10,
    font,
    color: black,
  });
  
  page.drawText('Amount Paid: P _________________________', {
    x: 350,
    y: y - 60,
    size: 10,
    font,
    color: black,
  });
  
  page.drawText('O.R. Number: _________________________', {
    x: 350,
    y: y - 80,
    size: 10,
    font,
    color: black,
  });
  
  // Footer
  page.drawText('This is a computer-generated document from AGAPP System.', {
    x: width / 2 - 120,
    y: 40,
    size: 8,
    font,
    color: gray,
  });
  
  page.drawText('Verify authenticity at https://agapp.liliw.gov.ph/verify', {
    x: width / 2 - 110,
    y: 28,
    size: 8,
    font,
    color: gray,
  });
  
  return await pdfDoc.save();
}

function getFormTitle(serviceType: string): string {
  const titles: Record<string, string> = {
    'Birth Certificate Request': 'APPLICATION FOR BIRTH CERTIFICATE',
    'Marriage Certificate Request': 'APPLICATION FOR MARRIAGE CERTIFICATE',
    'Death Certificate Request': 'APPLICATION FOR DEATH CERTIFICATE',
    'Business Permit Renewal': 'APPLICATION FOR BUSINESS PERMIT RENEWAL',
    'Business Permit New': 'APPLICATION FOR NEW BUSINESS PERMIT',
    'Barangay Clearance': 'APPLICATION FOR BARANGAY CLEARANCE',
    'Cedula / Community Tax Certificate': 'APPLICATION FOR COMMUNITY TAX CERTIFICATE (CEDULA)',
    'Certificate of Indigency': 'APPLICATION FOR CERTIFICATE OF INDIGENCY',
    'Health / Sanitary Certificate': 'APPLICATION FOR HEALTH CERTIFICATE',
    'Building Permit': 'APPLICATION FOR BUILDING PERMIT',
    'Agricultural Certificate': 'APPLICATION FOR AGRICULTURAL CERTIFICATE',
  };
  
  return titles[serviceType] || `APPLICATION FOR ${serviceType.toUpperCase()}`;
}

interface FormField {
  label: string;
  value: string;
}

function getFormFields(serviceType: string, formDetails: Record<string, string>): FormField[] {
  const commonFields: FormField[] = [
    { label: 'Full Name', value: formDetails.fullName || formDetails.ownerName || '' },
    { label: 'Address', value: formDetails.address || formDetails.barangay || '' },
    { label: 'Contact Number', value: formDetails.contactNumber || '' },
  ];
  
  switch (serviceType) {
    case 'Birth Certificate Request':
      return [
        { label: 'Name of Registrant', value: formDetails.fullName || '' },
        { label: 'Date of Birth', value: formDetails.birthDate || '' },
        { label: 'Place of Birth', value: formDetails.placeOfBirth || '' },
        { label: 'Father\'s Name', value: formDetails.fatherName || '' },
        { label: 'Mother\'s Name', value: formDetails.motherName || '' },
        { label: 'Purpose of Request', value: formDetails.purpose || 'Legal/Administrative' },
        { label: 'Requester Name', value: formDetails.requesterName || '' },
        { label: 'Relationship', value: formDetails.relationship || 'Self/Parent' },
      ];
      
    case 'Business Permit Renewal':
    case 'Business Permit New':
      return [
        { label: 'Business Name', value: formDetails.businessName || '' },
        { label: 'Owner Name', value: formDetails.ownerName || '' },
        { label: 'Line of Business', value: formDetails.lineOfBusiness || '' },
        { label: 'Business Address', value: formDetails.barangay || '' },
        { label: 'Capitalization', value: formDetails.capitalization ? `₱${formDetails.capitalization}` : '' },
        { label: 'DTI/SEC Reg. No.', value: formDetails.dtiNumber || '_______________' },
      ];
      
    case 'Barangay Clearance':
      return [
        { label: 'Full Name', value: formDetails.fullName || '' },
        { label: 'Date of Birth', value: formDetails.birthDate || '' },
        { label: 'Place of Birth', value: formDetails.placeOfBirth || '' },
        { label: 'Civil Status', value: formDetails.civilStatus || '' },
        { label: 'Period of Residency', value: formDetails.residency || '' },
        { label: 'Purpose', value: formDetails.purpose || 'Employment' },
      ];
      
    case 'Cedula / Community Tax Certificate':
      return [
        { label: 'Full Name', value: formDetails.fullName || '' },
        { label: 'TIN', value: formDetails.tin || 'N/A' },
        { label: 'Height', value: formDetails.height || '' },
        { label: 'Weight', value: formDetails.weight || '' },
        { label: 'ICR No. (if alien)', value: formDetails.icr || 'N/A' },
        { label: 'Basic Tax', value: '₱5.00' },
        { label: 'Gross Receipts', value: formDetails.grossIncome || '' },
      ];
      
    default:
      // Generic fields for any service
      return Object.entries(formDetails).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: value || '',
      }));
  }
}
