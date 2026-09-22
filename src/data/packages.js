// Ofertas de demonstração fornecidas pelo responsável pela HABILITA+.
export const DEFAULT_PACKAGES = [
  {
    id: "pacote-carro-exemplo",
    name: "Pacote Carro",
    category: "B",
    lessons: 2,
    price: 299,
    active: true,
    examVehicle: true,
    freeRetest: true,
    cardInstallments: 3,
    boletoInstallments: 6,
  },
  {
    id: "pacote-moto-exemplo",
    name: "Pacote Moto",
    category: "A",
    lessons: 2,
    price: 169.9,
    active: true,
    examVehicle: true,
    freeRetest: true,
    cardInstallments: 3,
    boletoInstallments: 6,
  },
  {
    id: "pacote-carro-moto-exemplo",
    name: "Pacote Carro e Moto",
    category: "A+B",
    lessons: 4,
    carLessons: 2,
    motorcycleLessons: 2,
    price: 399.99,
    active: true,
    examVehicle: true,
    freeRetest: true,
    cardInstallments: 3,
    boletoInstallments: 6,
  },
];

export function lessonLabel(pack) {
  if (
    pack.category === "A+B" &&
    pack.carLessons > 0 &&
    pack.motorcycleLessons > 0
  )
    return `${String(pack.carLessons).padStart(2, "0")} aulas de carro + ${String(pack.motorcycleLessons).padStart(2, "0")} aulas de moto`;
  return `${String(pack.lessons).padStart(2, "0")} aulas ${pack.category === "A" ? "de moto" : pack.category === "B" ? "de carro" : "práticas"}`;
}
