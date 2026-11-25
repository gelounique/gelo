window.UB_LANG_TOP='.hud-cta';
(function(){var T={de:'Lass was bauen.',en:"Let's build something."};
function run(l){var h=document.querySelector('h2.split-l');if(!h)return;var txt=T[l]||T.de;
 if(!h.getAttribute('data-t')&&l==='de')return; if(h.getAttribute('data-t')===txt)return; h.setAttribute('data-t',txt);
 var k=0,words=txt.split(' ');h.textContent='';
 words.forEach(function(word,wi){var w=document.createElement('span');w.style.whiteSpace='nowrap';w.style.display='inline-block';
  Array.prototype.slice.call(word).forEach(function(ch){var s=document.createElement('span');s.className='w';s.textContent=ch;s.style.setProperty('--k',k++);w.appendChild(s)});
  h.appendChild(w);if(wi<words.length-1)h.appendChild(document.createTextNode(' '))})}
window.addEventListener('ub-lang',function(e){run(e.detail)});})();
