import localforage from "localforage";

const closetStore = localforage.createInstance({
  name: "WardrobeMagic",
  storeName: "closet",
});

export async function saveInventory(inventory) {
  await closetStore.setItem("inventory", inventory);
}

export async function loadInventory() {
  const data = await closetStore.getItem("inventory");
  return data || [];
}
