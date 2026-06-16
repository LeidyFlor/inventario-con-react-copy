export async function getMaterialState() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/materialState.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
export async function getUserName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/usersName.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
export async function getBrandName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/brandList.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
