import { useEffect,useRef } from 'react';
/** Presentation-only exit guard. Never saves, deletes or changes persisted draft semantics. */
export function useUnsavedChanges(dirty:boolean){
 const ref=useRef(dirty);ref.current=dirty;
 useEffect(()=>{
  const unload=(e:BeforeUnloadEvent)=>{if(ref.current){e.preventDefault();e.returnValue='';}};
  const click=(e:MouseEvent)=>{const target=e.target instanceof Element?e.target.closest('a[href]'):null;if(!ref.current||!target)return;const href=target.getAttribute('href');if(!href||href.startsWith('#')||target.getAttribute('target')==='_blank')return;if(!window.confirm('Há alterações não salvas. Sair sem salvar?')){e.preventDefault();e.stopPropagation();}};
  window.addEventListener('beforeunload',unload);document.addEventListener('click',click,true);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',click,true);};
 },[]);
 return ()=>!ref.current||window.confirm('Descartar alterações não salvas?');
}