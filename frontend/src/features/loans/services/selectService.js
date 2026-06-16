export async function getUserName() {
  // ubicacion de los datos a llamar
  const response = await fetch("/../../data/selects/usersName.json");

  // Se recuperon los datos y se responde con su envio
  return response.json();
}
export async function getLoanTypes() {
    
    const response = await fetch("/../../data/selects/loanType.json");

    return response.json();
}
