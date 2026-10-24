const proteins = ['Chickpea', 'Faba', 'Lentil', 'Mungbean', 'Pea', 'Soy'];

export function validateProfiles(req, res) {
  const profiles = req.body?.profiles || {};
  const results = proteins.map((ingredient) => {
    const profile = profiles[ingredient] || {};
    const price = profile.pricePerKg === '' || profile.pricePerKg == null ? null : Number(profile.pricePerKg);
    const protein = profile.proteinPer100g === '' || profile.proteinPer100g == null ? null : Number(profile.proteinPer100g);
    const ready = Number.isFinite(price) && price > 0 && Number.isFinite(protein) && protein >= 0 && protein <= 100 && Boolean(profile.source?.trim());
    return { ingredient, ready, pricePerKg: Number.isFinite(price) ? price : null, proteinPer100g: Number.isFinite(protein) ? protein : null, source: profile.source || '' };
  });
  res.json({ profiles: results, readyCount: results.filter((item) => item.ready).length, total: proteins.length, message: 'Only use verified ingredient-grade data. Source must identify the supplier/specification or nutrition reference.' });
}
