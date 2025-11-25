import InvoiceNumber from '../models/NumeroFacture.js';
import Config from '../models/Configuration.js';

/**
 * getNextInvoiceNumber
 * @param {Object} options { userId, formatOption, perUser } 
 * perUser = true => scope = userId else 'global'
 */
export async function getNextInvoiceNumber({ userId, formatOption } = {}) {
  const scope = formatOption?.perUser ? String(userId) : 'global';

  const doc = await InvoiceNumber.findOneAndUpdate(
    { scope },
    { $inc: { dernierNumero: 1 }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true }
  );

  const n = doc.dernierNumero; // entier
  // formatation : zéro-padding (4 chiffres par défaut)
  const pad = (num, width = 4) => String(num).padStart(width, '0');

  const now = new Date();
  const year = now.getFullYear();

  // formatOption exemple:
  // { template: 'FAC-{year}-{num}', pad: 4, perUser: false }
  const template = (formatOption && formatOption.template) || 'FAC-{num}';
  const padWidth = (formatOption && formatOption.pad) || 4;

  let numero = template
    .replace('{num}', pad(n, padWidth))
    .replace('{year}', String(year))
    .replace('{userId}', String(userId).slice(-6)); // partie du userId si besoin

  return { numero, raw: n };
}
