export async function getUserTypes() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/userTypes.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
export async function getTaskState() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/taskState.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
export async function getUserName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/usersName.json");
  return response.json();
}