export type Capture = { id: string; session: string; medium: string; photo: Blob; created: number; owner: string };
async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("inversion-captures", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("captures", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Could not save this photo on the device. Keep the original and retry."));
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction("captures", mode), request = action(tx.objectStore("captures"));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error("Photo storage was interrupted. Keep the original and retry.")); };
  });
}
export const putCapture = (item: Capture) => run("readwrite", store => store.put(item));
export const removeCapture = (id: string) => run("readwrite", store => store.delete(id));
export async function captures(owner: string) { return (await run<Capture[]>("readonly", store => store.getAll())).filter(x => x.owner === owner).sort((a, b) => a.created - b.created); }
export async function preparePhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not open this image. Take a fresh photo or select a JPEG.")); image.src = url; });
    const scale = Math.min(1, 2200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Could not prepare this photo.");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not prepare this photo.")), "image/jpeg", 0.9));
  } finally { URL.revokeObjectURL(url); }
}
