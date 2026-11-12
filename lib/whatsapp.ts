/**
 * WhatsApp helpers shared by the members table and the dashboard.
 */

/** wa.me only accepts digits (no "+", spaces or dashes). */
export function whatsappNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Bilingual (EN/AR) membership expiry reminder. */
export function buildReminderMessage(name: string, daysLeft: number): string {
  const expiryTextEn = daysLeft <= 0
    ? (daysLeft === 0 ? 'expires today' : `expired ${Math.abs(daysLeft)} days ago`)
    : (daysLeft === 1 ? 'expires tomorrow' : `expires in ${daysLeft} days`);

  const expiryTextAr = daysLeft <= 0
    ? (daysLeft === 0 ? 'تنتهي اليوم' : `انتهت منذ ${Math.abs(daysLeft)} أيام`)
    : (daysLeft === 1 ? 'تنتهي غداً' : `تنتهي خلال ${daysLeft} أيام`);

  return `Hi ${name},
Just a friendly reminder that your AMA membership ${expiryTextEn}. It's been a pleasure having you as part of our fitness community and seeing you work towards your goals!

عزيزي ${name}،

نأمل أن تجدك هذه الرسالة بخير وأن تكون عضويتك في AMA Fitness First جزءًا قيمًا من رحلتك في اللياقة البدنية.

أردنا أن نخبرك أن عضويتك ${expiryTextAr}. ومع ذلك، نأمل ألا تكون هذه هي النهاية بل بداية التزام متجدد بصحتك وعافيتك.

لتجديد عضويتك اليوم، يرجى الاتصال بنا على الرقم 
71/113930 أو زيارة مكتب الاستقبال في AMA Fitness First.

مع أطيب التحيات،
فريق AMA Fitness First`;
}

export function buildReminderUrl(phone: string, name: string, daysLeft: number): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(buildReminderMessage(name, daysLeft))}`;
}
