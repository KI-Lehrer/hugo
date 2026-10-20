import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const planningApps={klassenflow:{name:'KlassenFLOW',url:'https://app.klassenflow.com/'},learningview:{name:'LearningView',url:'https://learningview.org/app/#!/'}};
export function validateSnapshot(input,now=new Date()){
  const app=planningApps[input.source];if(!app)throw new Error('Unbekannte Planungsquelle.');
  if(typeof input.text!=='string'||input.text.trim().length<20||input.text.length>65000)throw new Error('Bitte einen lesbaren Planungsauszug mit maximal 65000 Zeichen übernehmen.');
  const url=new URL(input.url||app.url);if(url.origin!==new URL(app.url).origin)throw new Error('Quelle und Webadresse passen nicht zusammen.');
  const date=input.weekStart||null;if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||new Date(date).getUTCDay()!==1))throw new Error('Ungültiger Wochenbeginn.');
  return {source:input.source,name:app.name,url:app.url,scope:input.source==='learningview'?'Sichtbare Materialien im ausgewählten Kurs, kein vollständiger Wochenplan':'Sichtbare Wochenplanung',weekStart:input.source==='klassenflow'?date:null,text:input.text.trim(),capturedAt:now.toISOString()};
}
export async function createIntegrations(data){
  const file=path.join(data,'integrations.json');
  let saved=await fs.readFile(file,'utf8').then(JSON.parse).catch(()=>({snapshots:{},settings:{weatherCity:'',calendarUrl:''}}));
  saved.snapshots||={};saved.settings||={weatherCity:'',calendarUrl:''};
  const keyFile=path.join(data,'browser-key');let bridgeKey=await fs.readFile(keyFile,'utf8').catch(()=>null);
  if(!bridgeKey){bridgeKey=crypto.randomBytes(32).toString('hex');await fs.writeFile(keyFile,bridgeKey,{mode:0o600});}
  const persist=()=>fs.writeFile(file,JSON.stringify(saved,null,2),{mode:0o600});
  return {
    bridgeKey,
    state:()=>({sources:Object.keys(planningApps).map(id=>({id,...planningApps[id],snapshot:saved.snapshots[id]?{capturedAt:saved.snapshots[id].capturedAt,weekStart:saved.snapshots[id].weekStart,scope:saved.snapshots[id].scope}:null})),settings:{...saved.settings}}),
    snapshots:()=>Object.values(saved.snapshots),
    async ingest(input){const snapshot=validateSnapshot(input);saved.snapshots[input.source]=snapshot;await persist();return snapshot;},
    async remove(id){if(!planningApps[id])throw new Error('Unbekannte Quelle.');delete saved.snapshots[id];await persist();},
    async settings(input){
      if(Object.hasOwn(input,'weatherCoords')) {
        const coords=input.weatherCoords;
        if(coords!==null&&(!coords||!Number.isFinite(coords.latitude)||!Number.isFinite(coords.longitude)||Math.abs(coords.latitude)>90||Math.abs(coords.longitude)>180)) throw new Error('Ungültiger Standort.');
        saved.settings.weatherCoords=coords?{latitude:Math.round(coords.latitude*100)/100,longitude:Math.round(coords.longitude*100)/100}:null;
        if(coords)saved.settings.weatherCity='';
      }
      if(typeof input.weatherCity==='string'){
        saved.settings.weatherCity=input.weatherCity.trim().slice(0,100);
        if(saved.settings.weatherCity)saved.settings.weatherCoords=null;
      }
      if(typeof input.calendarUrl==='string'){
        if(input.calendarUrl){const url=new URL(input.calendarUrl);if(url.username||url.password||input.calendarUrl.length>2000||url.protocol!=='https:'||url.hostname!=='calendar.google.com'||url.pathname!=='/calendar/embed')throw new Error('Hier wird eine Google-Kalender-Einbettungsadresse unterstützt.');}
        saved.settings.calendarUrl=input.calendarUrl;
      }
      await persist();return {...saved.settings};
    }
  };
}
export function planningContext(snapshots,week,now=new Date()){
  const documents=[],warnings=[];
  for(const [id,app] of Object.entries(planningApps)){
    const snapshot=snapshots.find(x=>x.source===id);
    if(!snapshot){warnings.push(`${app.name}: noch kein Browser-Auszug übernommen.`);continue;}
    const age=now-new Date(snapshot.capturedAt);
    if(age>86400000)warnings.push(`${app.name}: Auszug ist älter als 24 Stunden; vor der Zusammenfassung aktualisieren.`);
    if(id==='klassenflow'&&snapshot.weekStart!==week.start){warnings.push(`KlassenFLOW: Auszug gehört zu ${snapshot.weekStart||'einer nicht bestätigten Woche'}, nicht zur laufenden Woche. Nicht als aktuellen Wochenplan verwenden.`);continue;}
    if(id==='learningview')warnings.push('LearningView liefert nur die übernommene sichtbare Kurs-/Materialansicht. Ohne explizites Datum ist sie kein Nachweis einer Aufgabe für die laufende Woche.');
    documents.push(snapshot);
  }
  return {documents,warnings};
}
const weatherCache=new Map();
export async function weather(city,coords){
  if(coords){const {latitude,longitude}=coords;if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new Error('Ungültiger Standort.');return forecastAt({latitude:Math.round(latitude*100)/100,longitude:Math.round(longitude*100)/100,name:'Aktueller Standort (ungefähr)'});}
  if(!city)throw new Error('Bitte zuerst einen Wetterort festlegen.');
  const cached=weatherCache.get(city.toLowerCase());if(cached&&Date.now()-cached.at<600000)return cached.value;
  const geoUrl=new URL('https://geocoding-api.open-meteo.com/v1/search');geoUrl.search=new URLSearchParams({name:city,count:'1',language:'de',format:'json'});
  const geo=await fetch(geoUrl,{signal:AbortSignal.timeout(12000)});if(!geo.ok)throw new Error('Ortssuche derzeit nicht erreichbar.');
  const place=(await geo.json()).results?.[0];if(!place)throw new Error('Ort nicht gefunden. Bitte Ort und Land angeben.');
  const value=await forecastAt(place);weatherCache.set(city.toLowerCase(),{at:Date.now(),value});return value;
}
async function forecastAt(place){
  const forecast=new URL('https://api.open-meteo.com/v1/forecast');forecast.search=new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'Europe/Zurich',forecast_days:'3'});
  const response=await fetch(forecast,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Wetterdienst derzeit nicht erreichbar.');
  const result=await response.json();const value={place:`${place.name}${place.admin1?', '+place.admin1:''}`,current:result.current,daily:result.daily,fetchedAt:new Date().toISOString(),attribution:'Open-Meteo',url:'https://open-meteo.com/'};
  return value;
}
