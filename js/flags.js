// MundialPibes26 - Flags via flagcdn.com

var FLAG_ISO = {
  'MEX': 'mx', 'RSA': 'za', 'KOR': 'kr', 'CZE': 'cz',
  'CAN': 'ca', 'BIH': 'ba', 'QAT': 'qa', 'SUI': 'ch',
  'BRA': 'br', 'MAR': 'ma', 'HAI': 'ht', 'SCO': 'gb-sct',
  'USA': 'us', 'PAR': 'py', 'AUS': 'au', 'TUR': 'tr',
  'GER': 'de', 'CUW': 'cw', 'CIV': 'ci', 'ECU': 'ec',
  'NED': 'nl', 'JPN': 'jp', 'SWE': 'se', 'TUN': 'tn',
  'BEL': 'be', 'EGY': 'eg', 'IRN': 'ir', 'NZL': 'nz',
  'ESP': 'es', 'CPV': 'cv', 'KSA': 'sa', 'URU': 'uy',
  'FRA': 'fr', 'SEN': 'sn', 'IRQ': 'iq', 'NOR': 'no',
  'ARG': 'ar', 'ALG': 'dz', 'AUT': 'at', 'JOR': 'jo',
  'POR': 'pt', 'COD': 'cd', 'UZB': 'uz', 'COL': 'co',
  'ENG': 'gb-eng', 'CRO': 'hr', 'GHA': 'gh', 'PAN': 'pa'
};

var TEAM_SHORT_NAMES = {
  'MEX': 'Mexico', 'RSA': 'Sudafrica', 'KOR': 'Corea del Sur', 'CZE': 'Chequia',
  'CAN': 'Canada', 'BIH': 'Bosnia', 'QAT': 'Qatar', 'SUI': 'Suiza',
  'BRA': 'Brasil', 'MAR': 'Marruecos', 'HAI': 'Haiti', 'SCO': 'Escocia',
  'USA': 'EE.UU.', 'PAR': 'Paraguay', 'AUS': 'Australia', 'TUR': 'Turquia',
  'GER': 'Alemania', 'CUW': 'Curazao', 'CIV': 'C. de Marfil', 'ECU': 'Ecuador',
  'NED': 'Paises Bajos', 'JPN': 'Japon', 'SWE': 'Suecia', 'TUN': 'Tunez',
  'BEL': 'Belgica', 'EGY': 'Egipto', 'IRN': 'Iran', 'NZL': 'N. Zelanda',
  'ESP': 'Espana', 'CPV': 'Cabo Verde', 'KSA': 'Arabia Saudita', 'URU': 'Uruguay',
  'FRA': 'Francia', 'SEN': 'Senegal', 'IRQ': 'Irak', 'NOR': 'Noruega',
  'ARG': 'Argentina', 'ALG': 'Argelia', 'AUT': 'Austria', 'JOR': 'Jordania',
  'POR': 'Portugal', 'COD': 'R. del Congo', 'UZB': 'Uzbekistan', 'COL': 'Colombia',
  'ENG': 'Inglaterra', 'CRO': 'Croacia', 'GHA': 'Ghana', 'PAN': 'Panama'
};

function getFlagUrl(code) {
  if (!code || code.length > 3) return null;
  var iso = FLAG_ISO[code];
  if (!iso) return null;
  return 'https://flagcdn.com/h40/' + iso + '.png';
}

function getFlagImg(code, size) {
  var url = getFlagUrl(code);
  var s = size || 40;
  if (!url) {
    return '<span style="display:inline-block;width:' + s + 'px;height:' + Math.round(s * 0.67) + 'px;background:#333;border-radius:3px;vertical-align:middle;"></span>';
  }
  return '<img src="' + url + '" width="' + s + '" alt="" style="display:inline-block;vertical-align:middle;border-radius:2px;">';
}

function getTeamName(code) {
  if (!code) return 'Por determinar';
  if (code.length > 3) return code;
  return TEAM_SHORT_NAMES[code] || code;
}

function getTeamShortName(code) {
  if (!code) return 'TBD';
  if (code.length > 3) return code;
  var name = TEAM_SHORT_NAMES[code] || code;
  return name.length > 10 ? name.substring(0, 9) + '.' : name;
}
