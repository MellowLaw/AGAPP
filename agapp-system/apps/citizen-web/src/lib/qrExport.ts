/**
 * Utility to download QR code SVG as high-resolution PNG image
 */
export function downloadQrCodeAsPng(containerId: string, fileName: string = 'AGAPP-Claim-QR.png') {
  if (typeof window === 'undefined') return;

  const container = document.getElementById(containerId);
  const svgElement = container?.querySelector('svg');

  if (!svgElement) {
    console.warn('QR code SVG element not found in #' + containerId);
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 3; // 3x high-resolution crisp output
    const qrSize = (svgElement.clientWidth || 200) * scale;
    const padding = 24 * scale;
    const textHeight = 44 * scale;

    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crisp white background with border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR Code
    ctx.drawImage(img, padding, padding, qrSize, qrSize);

    // Text Header / Ref Code
    ctx.fillStyle = '#1C1917';
    ctx.font = `bold ${14 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    const cleanLabel = fileName.replace(/\.png$/i, '');
    ctx.fillText(cleanLabel, canvas.width / 2, canvas.height - 24 * scale);

    // Subtext watermark
    ctx.fillStyle = '#78716C';
    ctx.font = `${9 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText('AGAPP Local Government Electronic Portal', canvas.width / 2, canvas.height - 10 * scale);

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    downloadLink.href = pngUrl;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);
  };

  img.src = url;
}
