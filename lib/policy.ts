const RESTRICTED_SERVICE_TERMS = [
  'pijat', 'massage', 'spa plus', 'plus plus', 'escort', 'prostitusi', 'seks', 'sexual', 'open bo',
  'booking cewek', 'booking cowok', 'teman kencan', 'jasa dewasa', 'adult service',
  'judi', 'taruhan', 'casino', 'kasino', 'slot online', 'togel',
  'narkoba', 'sabu', 'kokain', 'ganja', 'heroin', 'obat terlarang',
  'senjata api', 'pistol', 'senapan', 'amunisi', 'bom', 'bahan peledak',
  'dokumen palsu', 'ijazah palsu', 'sertifikat palsu', 'identitas palsu',
  'rekening ilegal', 'jual rekening', 'rekening penampung', 'money mule',
  'pinjaman ilegal', 'pinjol ilegal', 'investasi bodong', 'skema ponzi',
  'jual organ', 'perdagangan manusia', 'human trafficking',
  'les private', 'les privat', 'guru privat', 'tutor privat', 'private tutoring'
];

export const isRestrictedListing = (listing: { title?: string; description?: string; condition?: string; category?: string }) => {
  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
  return RESTRICTED_SERVICE_TERMS.some(term => text.includes(term));
};

export const restrictedServiceMessage = 'Layanan ini tidak dapat dipublikasikan di Lumagada karena berpotensi melanggar hukum, keselamatan, atau kebijakan platform.';
