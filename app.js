const form=document.querySelector('#search-form'),input=document.querySelector('#city'),message=document.querySelector('#message'),result=document.querySelector('#result');
const codes={
  0:['Clear sky','☀'],1:['Mostly clear','🌤'],2:['Partly cloudy','⛅'],3:['Overcast','☁'],45:['Fog','〰'],48:['Fog','〰'],51:['Drizzle','☂'],53:['Drizzle','☂'],55:['Heavy drizzle','☂'],61:['Light rain','☂'],63:['Rain','☂'],65:['Heavy rain','☂'],71:['Light snow','❄'],73:['Snow','❄'],75:['Heavy snow','❄'],80:['Rain showers','☂'],81:['Showers','☂'],82:['Heavy showers','☂'],95:['Thunderstorm','⚡'],96:['Storm with hail','⚡'],99:['Storm with hail','⚡']
}
;
const wx=c=>codes[c]||['Changing skies','☁'];
const day=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{
  weekday:'short'
}
);
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const place=input.value.trim();
  if(!place)return;
  message.textContent='Looking up the forecast…';
  result.hidden=true;
  try{
    const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${
      encodeURIComponent(place)
    }
    &count=1&language=en&format=json`);
    if(!g.ok)throw Error('The location service is unavailable. Please try again.');
    const found=(await g.json()).results?.[0];
    if(!found)throw Error(`No place found for “${
      place
    }
    ”. Try adding a country name.`);
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${
      found.latitude
    }
    &longitude=${
      found.longitude
    }
    &current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
    const res=await fetch(url);
    if(!res.ok)throw Error('The forecast service did not respond. Please try again.');
    const data=await res.json(),c=data.current,d=data.daily;
    document.querySelector('#location').textContent=[found.name,found.admin1,found.country].filter(Boolean).join(', ');
    document.querySelector('#date').textContent=new Date().toLocaleDateString(undefined,{
      weekday:'long',month:'long',day:'numeric'
    }
    );
    document.querySelector('#temperature').textContent=Math.round(c.temperature_2m)+'°';
    document.querySelector('#condition').textContent=wx(c.weather_code)[0];
    document.querySelector('#icon').textContent=wx(c.weather_code)[1];
    document.querySelector('#high').textContent=Math.round(d.temperature_2m_max[0])+'°';
    document.querySelector('#low').textContent=Math.round(d.temperature_2m_min[0])+'°';
    const list=document.querySelector('#forecast');
    list.replaceChildren();
    d.time.slice(1).forEach((date,i)=>{
      const n=i+1,row=document.createElement('div');
      row.className='day';
      const name=document.createElement('span');
      name.textContent=day(date);
      const ico=document.createElement('span');
      ico.className='wx';
      ico.textContent=wx(d.weather_code[n])[1];
      ico.setAttribute('aria-label',wx(d.weather_code[n])[0]);
      const temps=document.createElement('span');
      temps.className='temps';
      temps.innerHTML=`<b>${
        Math.round(d.temperature_2m_max[n])
      }
      °</b> / ${
        Math.round(d.temperature_2m_min[n])
      }
      °`;
      row.append(name,ico,temps);
      list.append(row)
    }
    );
    result.hidden=false;
    message.textContent=''
  }
  catch(err){
    message.textContent=err.message||'Something went wrong. Please try again.'
  }
}
