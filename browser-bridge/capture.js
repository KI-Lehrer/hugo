function capturePlanning(){
  if(location.origin==='https://app.klassenflow.com'){
    const grid=document.getElementById('grid');if(!grid||!grid.getClientRects().length)throw new Error('Bitte den Wochenplan öffnen.');
    const heading=document.querySelector('.week-nav-inline')?.innerText||document.title;
    let date=document.getElementById('wk-jump')?.value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')){
      const day=grid.querySelector('.day-date')?.innerText.match(/(\d{1,2})\.(\d{1,2})/),year=heading.match(/\b20\d{2}\b/);
      if(day&&year)date=`${year[0]}-${day[2].padStart(2,'0')}-${day[1].padStart(2,'0')}`;
    }
    if(!date)throw new Error('Wochenbeginn ist nicht erkennbar. Bitte die aktuelle Woche anzeigen.');
    const monday=new Date(date+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
    const days=[...grid.querySelectorAll('.day-header .day-date')].map(e=>e.innerText);
    const lessons=[...grid.querySelectorAll('.lesson-cell')].filter(e=>e.querySelector('.lesson-class')).map(e=>{
      const day=Number(e.dataset.day),hour=e.dataset.hour;
      const subject=e.querySelector('.lesson-class')?.innerText||'';
      const topic=e.querySelector('.lesson-topic')?.innerText||'(noch ohne Thema)';
      const note=e.querySelector('.lesson-note');
      return `${['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'][day]||'Tag unbekannt'} ${days[day]||''}, Stundenplan-Slot ${hour}: ${subject}\n${topic}\n${note?.getAttribute('title')||note?.innerText||''}`;
    });
    if(!lessons.length)throw new Error('Keine Unterrichtslektionen sichtbar.');
    return {source:'klassenflow',url:location.href,weekStart:monday.toISOString().slice(0,10),text:`${heading}\n\n${lessons.join('\n\n')}`};
  }
  if(location.origin==='https://learningview.org'){
    const teacher=document.getElementById('navbarTeachBtn');if(!teacher)throw new Error('Bitte die Lehrpersonen-Kursansicht öffnen.');
    const roots=['mainTopicList','learningGoalsMainPage'].map(id=>document.getElementById(id)).filter(e=>e&&e.getClientRects().length);
    const root=roots[roots.length-1];if(!root)throw new Error('Bitte Materialien oder eine Aufgabe öffnen. Schüler-Arbeitsstände werden nicht übernommen.');
    const text=`${teacher.innerText}\nSichtbare Materialansicht – kein bestätigter Wochenplan.\n${root.innerText.replace(/[\uE000-\uF8FF]/g,'').trim()}`;
    return {source:'learningview',url:location.href,weekStart:null,text};
  }
  throw new Error('Diese Seite wird nicht unterstützt.');
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message.type!=='capture')return;
  try{respond({snapshot:capturePlanning()});}catch(error){respond({error:error.message});}
});
