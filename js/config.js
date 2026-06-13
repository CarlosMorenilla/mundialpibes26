// MundialPibes26 - Configuracion

var SUPABASE_URL = 'https://uhhhxoihtfzlirxohhle.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaGh4b2lodGZ6bGlyeG9oaGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTUyMjcsImV4cCI6MjA5NjY5MTIyN30.s3wbM08PpbGldrlPGvm8b886OcM6rEH_p1VsvH2QuaY';

var supabase = null;

if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

var THESPORTSDB_API = 'https://www.thesportsdb.com/api/v1/json/3';
var THESPORTSDB_LEAGUE_ID = '4429';
var WORLDCUP_API = 'https://worldcup26.ir';

var APP_CONFIG = {
  name: 'MundialPibes26',
  tournamentStart: '2026-06-11T19:00:00-06:00',
  tournamentEnd: '2026-07-19T17:00:00-04:00',
  points: {
    winner: 1,
    exactScore: 3
  },
  refreshInterval: 60000,
  liveRefreshInterval: 30000
};
