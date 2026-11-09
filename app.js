// ===== НАЛАШТУВАННЯ =====
const firebaseConfig={apiKey:"AIzaSyB2qAWXjhRsKASf9Urz_j3OtX_ERv9LKGk",authDomain:"sonechko-c1d59.firebaseapp.com",databaseURL:"https://sonechko-c1d59-default-rtdb.firebaseio.com",projectId:"sonechko-c1d59",storageBucket:"sonechko-c1d59.firebasestorage.app",messagingSenderId:"154000560138",appId:"1:154000560138:web:3150ce210a405435b58ff3",measurementId:"G-CHBK537FEV"};
const CLD={cloud:'drmnljqex',preset:'ml_default'}; // preset має бути Unsigned
const NP_KEY='';                    // API-ключ Нової Пошти (необов'язково): список міст і відділень
const CARD='0000 0000 0000 0000';   // ваша картка для переказів
// ========================
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database();
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n).toLocaleString('uk-UA')+' ₴';
const ST={new:'Нове',paid:'Оплачено',sent:'Відправлено',done:'Виконано',cancel:'Скасовано'};
const R=h=>$('#app').innerHTML=h;
let P={},U=null,isAdmin=false,cat='',q='',editId=null,cart={};
try{cart=JSON.parse(localStorage.cart||'{}')}catch(e){}
const saveCart=()=>{localStorage.cart=JSON.stringify(cart);const c=$('#cc');if(c)c.textContent=Object.values(cart).reduce((a,b)=>a+b,0)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2800)};
const msg=e=>({'auth/invalid-credential':'Невірний email або пароль','auth/email-already-in-use':'Цей email уже зареєстровано','auth/weak-password':'Пароль закороткий','auth/invalid-email':'Некоректний email'}[e.code]||e.message);
const np=(model,m,p)=>fetch('https://api.novaposhta.ua/v2.0/json/',{method:'POST',body:JSON.stringify({apiKey:NP_KEY,modelName:model,calledMethod:m,methodProperties:p})}).then(r=>r.json()).then(r=>r.data||[]).catch(()=>[]);
async function up(f){const d=new FormData();d.append('file',f);d.append('upload_preset',CLD.preset);const r=await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloud}/image/upload`,{method:'POST',body:d}),j=await r.json();if(!j.secure_url)throw new Error(j.error?.message||'Не вдалося завантажити фото');return j.secure_url}

// ===== Авторизація =====
function nav(){$('#nav').innerHTML=`<a href="#/cart">Кошик<span class="badge" id="cc">0</span></a>`+(U?`<a href="#/profile">${esc(U.displayName||'Профіль')}</a>`+(isAdmin?'<a href="#/admin">Адмін</a>':''):'<button id="lg">Увійти</button>');const b=$('#lg');if(b)b.onclick=authModal;saveCart()}
auth.onAuthStateChanged(async u=>{U=u;isAdmin=false;if(u)try{isAdmin=(await db.ref('admins/'+u.uid).get()).val()===true}catch(e){}nav();route()});
function authModal(){if($('.modal'))return;let reg=false;const m=document.createElement('div');m.className='modal';document.body.append(m);
 const draw=()=>{m.innerHTML=`<form class="card row"><h3>${reg?'Реєстрація':'Вхід'}</h3>${reg?'<input name="name" placeholder="Імʼя" required>':''}<input name="email" type="email" placeholder="Email" required><input name="pw" type="password" minlength="6" placeholder="Пароль (від 6 символів)" required><button class="btn">${reg?'Створити акаунт':'Увійти'}</button><button type="button" class="btn ghost" id="g">Увійти через Google</button><button type="button" class="chip" id="sw">${reg?'Уже є акаунт? Увійти':'Немає акаунта? Зареєструватись'}</button>${reg?'':'<button type="button" class="chip" id="fp">Забули пароль?</button>'}<button type="button" class="chip" id="x">Закрити</button></form>`;
  const f=m.querySelector('form');
  f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));
   try{if(reg){const c=await auth.createUserWithEmailAndPassword(d.email,d.pw);await c.user.updateProfile({displayName:d.name});await db.ref('users/'+c.user.uid).update({name:d.name,email:d.email});nav()}else await auth.signInWithEmailAndPassword(d.email,d.pw);m.remove();toast('Вітаємо!')}catch(err){toast(msg(err))}};
  m.querySelector('#g').onclick=async()=>{try{const c=await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());await db.ref('users/'+c.user.uid).update({name:c.user.displayName||'',email:c.user.email||''});m.remove()}catch(err){toast(msg(err))}};
  m.querySelector('#sw').onclick=()=>{reg=!reg;draw()};
  m.querySelector('#x').onclick=()=>m.remove();
  const fp=m.querySelector('#fp');if(fp)fp.onclick=async()=>{const em=f.elements.email.value;if(!em)return toast('Введіть email');try{await auth.sendPasswordResetEmail(em);toast('Лист для відновлення надіслано')}catch(err){toast(msg(err))}}};
 draw()}

// ===== Роутер =====
const V={};
function route(){const[,r,a]=(location.hash||'#/').split('/');(V[r||'home']||V.home)(a)}
addEventListener('hashchange',()=>{route();scrollTo(0,0)});
db.ref('products').on('value',s=>{P=s.val()||{};route()});
$('#q').oninput=e=>{q=e.target.value.toLowerCase();if(location.hash.length>2)location.hash='#/';else route()};

// ===== Каталог =====
const tile=p=>`<article class="tile"><a href="#/p/${p.id}"><img src="${esc(p.img||'')}" alt="${esc(p.name)}" loading="lazy"><h3>${esc(p.name)}</h3></a><div class="pr">${money(p.price)}</div><button class="btn dark" onclick="add('${p.id}')">У кошик</button></article>`;
V.home=()=>{const all=Object.entries(P).map(([id,p])=>({id,...p})).sort((a,b)=>b.ts-a.ts),cats=[...new Set(all.map(p=>p.cat).filter(Boolean))];
 const list=all.filter(p=>(!cat||p.cat===cat)&&(p.name+' '+(p.desc||'')).toLowerCase().includes(q));
 R(`<section class="hero"><h1>Усе потрібне — з самого ранку</h1><p>Світанок: товари на кожен день із доставкою по всій Україні.</p><button class="btn" onclick="$('#chips').scrollIntoView({behavior:'smooth'})">До каталогу</button></section><div class="chips" id="chips"><button class="chip ${cat?'':'on'}" data-c="">Усе</button>${cats.map(c=>`<button class="chip ${c===cat?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="grid">${list.map(tile).join('')||'<p>Нічого не знайдено. Спробуйте інший запит чи категорію.</p>'}</div>`);
 document.querySelectorAll('.chip[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;route()})};
V.p=id=>{const p=P[id];if(!p)return R('<p>Товар не знайдено. <a href="#/">До каталогу</a></p>');
 R(`<p><a href="#/">Каталог</a> / ${esc(p.cat||'Без категорії')}</p><div class="pd"><img src="${esc(p.img||'')}" alt="${esc(p.name)}"><div><h1>${esc(p.name)}</h1><p class="pr big">${money(p.price)}</p><p style="margin-bottom:16px">${esc(p.desc||'')}</p><button class="btn" onclick="add('${id}')">Додати в кошик</button></div></div>`)};

// ===== Кошик =====
function add(id,n=1){cart[id]=(cart[id]||0)+n;saveCart();toast('Додано в кошик')}
function chg(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];saveCart();route()}
const items=()=>Object.entries(cart).filter(([id])=>P[id]);
const total=it=>it.reduce((s,[id,n])=>s+P[id].price*n,0);
V.cart=()=>{const it=items();
 R(`<h2>Кошик</h2>${it.length?`<div class="card">${it.map(([id,n])=>`<div class="ci"><img src="${esc(P[id].img||'')}" alt=""><div style="flex:1"><b>${esc(P[id].name)}</b><br>${money(P[id].price)}</div><button class="btn ghost" onclick="chg('${id}',-1)" aria-label="Менше">−</button><b>${n}</b><button class="btn ghost" onclick="chg('${id}',1)" aria-label="Більше">+</button></div>`).join('')}<p style="text-align:right;font-size:20px;margin:14px 0"><b>Разом: ${money(total(it))}</b></p><a class="btn" href="#/checkout">Оформити замовлення</a></div>`:'<p>Кошик порожній. <a href="#/"><u>Обрати товари</u></a></p>'}`)};

// ===== Оформлення =====
V.checkout=()=>{const it=items();if(!it.length)return location.hash='#/cart';
 if(!U){authModal();return R('<p>Щоб оформити замовлення, увійдіть або зареєструйтесь.</p>')}
 const tot=total(it);
 R(`<h2>Оформлення замовлення</h2><form id="co" class="card row"><div class="two row"><input name="name" placeholder="Імʼя та прізвище" value="${esc(U.displayName||'')}" required><input name="phone" type="tel" placeholder="Телефон +380…" required></div><b>Доставка</b><label><input type="radio" name="dl" value="Нова Пошта" checked> Нова Пошта, відділення</label><label><input type="radio" name="dl" value="Укрпошта"> Укрпошта, адреса та індекс</label><label><input type="radio" name="dl" value="Самовивіз"> Самовивіз</label><div id="dlf" class="row"></div><b>Оплата</b><label><input type="radio" name="pay" value="Накладений платіж" checked> Накладений платіж, при отриманні</label><label><input type="radio" name="pay" value="Переказ на картку"> Переказ на картку</label><textarea name="note" placeholder="Коментар до замовлення"></textarea><p style="font-size:20px"><b>До сплати: ${money(tot)}</b></p><button class="btn">Підтвердити замовлення</button></form>`);
 const f=$('#co'),dlf=$('#dlf');
 const setDl=()=>{const t=f.elements.dl.value;
  if(t==='Самовивіз')dlf.innerHTML='<p>Адресу самовивозу уточнимо за телефоном.</p>';
  else if(t==='Нова Пошта'&&NP_KEY)npForm(dlf);
  else dlf.innerHTML=`<input name="city" placeholder="Місто" required><input name="point" placeholder="${t==='Укрпошта'?'Вулиця, будинок, індекс':'Номер відділення Нової Пошти'}" required>`};
 f.querySelectorAll('[name=dl]').forEach(r=>r.onchange=setDl);setDl();
 f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f)),b=f.querySelector('.btn'),id=db.ref('orders').push().key;b.disabled=true;
  const o={uid:U.uid,email:U.email||'',name:d.name,phone:d.phone,items:it.map(([i,n])=>({id:i,name:P[i].name,price:P[i].price,qty:n})),total:tot,delivery:d.dl,city:d.city||'',point:d.point||'',pay:d.pay,note:d.note||'',status:'new',ts:Date.now()};
  try{await db.ref().update({['orders/'+id]:o,[`users/${U.uid}/orders/${id}`]:o,[`users/${U.uid}/phone`]:d.phone});cart={};saveCart();
   R(`<div class="card"><h2>Дякуємо! Замовлення прийнято</h2><p>Номер замовлення: <b>${id.slice(-6).toUpperCase()}</b></p>${d.pay==='Переказ на картку'?`<p>Сплатіть ${money(tot)} на картку <b>${CARD}</b>, у призначенні вкажіть номер замовлення.</p>`:''}<p style="margin-top:12px"><a class="btn" href="#/profile">Мої замовлення</a></p></div>`)}
  catch(err){toast('Помилка: '+err.message);b.disabled=false}}};
function npForm(box){box.innerHTML='<input name="city" list="cl" placeholder="Місто (почніть вводити)" autocomplete="off" required><datalist id="cl"></datalist><select name="point" required><option value="">Спочатку оберіть місто</option></select>';
 const c=box.querySelector('[name=city]'),sel=box.querySelector('select');let refs={};
 c.oninput=async()=>{if(c.value.length<2)return;const r=await np('Address','searchSettlements',{CityName:c.value,Limit:8});refs={};(r[0]?.Addresses||[]).forEach(a=>refs[a.Present]=a.DeliveryCity);
  $('#cl').innerHTML=Object.keys(refs).map(k=>`<option value="${esc(k)}">`).join('');
  if(refs[c.value]){const w=await np('Address','getWarehouses',{CityRef:refs[c.value],Limit:300});sel.innerHTML=w.map(x=>`<option>${esc(x.Description)}</option>`).join('')||'<option value="">Відділень не знайдено</option>'}}}

// ===== Профіль =====
V.profile=async()=>{if(!U){authModal();return R('<p>Увійдіть, щоб відкрити профіль.</p>')}
 const s=(await db.ref('users/'+U.uid).get()).val()||{},os=Object.entries(s.orders||{}).sort((a,b)=>b[1].ts-a[1].ts);
 R(`<h2>Профіль</h2><form id="pf" class="card row"><input name="name" value="${esc(U.displayName||'')}" placeholder="Імʼя"><input name="phone" value="${esc(s.phone||'')}" placeholder="Телефон"><p>${esc(U.email)}</p><div><button class="btn">Зберегти</button> <button type="button" class="btn ghost" id="out">Вийти</button></div></form><h3>Мої замовлення</h3>${os.map(([id,o])=>`<div class="card"><b>№ ${id.slice(-6).toUpperCase()}</b> від ${new Date(o.ts).toLocaleDateString('uk-UA')}, статус: <b>${ST[o.status]||o.status}</b><br>${(o.items||[]).map(i=>esc(i.name)+' × '+i.qty).join(', ')}<br><b>${money(o.total)}</b>, ${esc(o.delivery)}, ${esc(o.pay)}</div>`).join('')||'<p>Замовлень ще немає.</p>'}`);
 $('#out').onclick=()=>auth.signOut().then(()=>location.hash='#/');
 $('#pf').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));await U.updateProfile({displayName:d.name});await db.ref('users/'+U.uid).update({name:d.name,phone:d.phone});nav();toast('Збережено')}};

// ===== Адмін-панель =====
function ed(id){const p=P[id],x=$('#pf').elements;editId=id;x.name.value=p.name;x.price.value=p.price;x.cat.value=p.cat||'';x.desc.value=p.desc||'';x.img.value=p.img||'';$('#ft').textContent='Редагування: '+p.name;scrollTo(0,0)}
function del(id){if(confirm('Видалити товар?'))db.ref('products/'+id).remove()}
function setSt(id,uid,v){db.ref().update({[`orders/${id}/status`]:v,[`users/${uid}/orders/${id}/status`]:v}).then(()=>toast('Статус оновлено'))}
V.admin=async()=>{editId=null;if(!isAdmin)return R('<p>Немає доступу.</p>');
 const os=Object.entries((await db.ref('orders').get()).val()||{}).sort((a,b)=>b[1].ts-a[1].ts),cats=[...new Set(Object.values(P).map(p=>p.cat).filter(Boolean))];
 R(`<h2>Адмін-панель</h2><form id="pf" class="card row"><h3 id="ft">Новий товар</h3><input name="name" placeholder="Назва" required><div class="two row"><input name="price" type="number" min="0" step="0.01" placeholder="Ціна, ₴" required><input name="cat" placeholder="Категорія" list="cats"></div><datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist><textarea name="desc" placeholder="Опис"></textarea><input name="file" type="file" accept="image/*"><input name="img" type="hidden"><div><button class="btn">Зберегти товар</button> <button type="button" class="btn ghost" onclick="route()">Очистити форму</button></div></form>
 <h3>Товари</h3><div class="card">${Object.entries(P).map(([id,p])=>`<div class="ci"><img src="${esc(p.img||'')}" alt=""><div style="flex:1">${esc(p.name)}<br>${money(p.price)}, ${esc(p.cat||'без категорії')}</div><button class="btn ghost" onclick="ed('${id}')">Змінити</button><button class="btn ghost" onclick="del('${id}')">Видалити</button></div>`).join('')||'<p>Товарів ще немає. Додайте перший вище.</p>'}</div>
 <h3>Замовлення</h3><div class="scroll"><table><tr><th>№</th><th>Клієнт</th><th>Товари</th><th>Сума</th><th>Доставка й оплата</th><th>Статус</th></tr>${os.map(([id,o])=>`<tr><td>${id.slice(-6).toUpperCase()}<br>${new Date(o.ts).toLocaleString('uk-UA')}</td><td>${esc(o.name)}<br>${esc(o.phone)}<br>${esc(o.email)}</td><td>${(o.items||[]).map(i=>esc(i.name)+' × '+i.qty).join('<br>')}</td><td>${money(o.total)}</td><td>${esc(o.delivery)}<br>${esc(o.city)} ${esc(o.point)}<br>${esc(o.pay)}<br>${esc(o.note)}</td><td><select onchange="setSt('${id}','${o.uid}',this.value)">${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${k===o.status?'selected':''}>${v}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`);
 $('#pf').onsubmit=async e=>{e.preventDefault();const f=e.target,x=f.elements,b=f.querySelector('.btn');b.disabled=true;
  try{let img=x.img.value;if(x.file.files[0]){toast('Завантажую фото…');img=await up(x.file.files[0])}
   const p={name:x.name.value,price:+x.price.value,cat:x.cat.value.trim(),desc:x.desc.value,img,ts:Date.now()};
   if(editId){p.ts=P[editId].ts||p.ts;await db.ref('products/'+editId).set(p)}else await db.ref('products').push(p);
   toast('Товар збережено')}catch(err){toast('Помилка: '+err.message);b.disabled=false}}};
saveCart();
