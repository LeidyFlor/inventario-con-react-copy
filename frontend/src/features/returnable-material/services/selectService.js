export async function getMaterialCategory() {
  // ubicacion de los datos a llamar, en este casp la categoría
  const response = await fetch("/../../data/selects/materialCategory.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
// Estado del material
export async function getMaterialState() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/materialState.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
//Para el nombre del cuentadante
export async function getUserName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/usersName.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
// para los nombres de la marca
export async function getBrandName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/brandList.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
