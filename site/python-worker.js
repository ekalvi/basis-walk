// Disposable worker: explicit user opt-in; pinned third-party runtime; no server execution.
self.onmessage = async ({data}) => {
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    const python = await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
      stdout:text=>postMessage({text}),stderr:text=>postMessage({text})});
    const response = await fetch('walks.py');
    if(!response.ok)throw Error(`Source download failed (${response.status})`);
    python.FS.writeFile('walks.py',await response.text());
    await python.runPythonAsync(data.code);
    postMessage({text:'Finished. Finite checks are not infinite proofs.',done:true});
  } catch(error) { postMessage({text:String(error),done:true}); }
};
