export function slotRequest(day, slot, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || ""))
    return { error: "Selecione a data do horário que deseja liberar." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start || ""))
    return {
      error: "Preencha o início no formato hora e minuto, por exemplo 08:00.",
    };
  const start = `${day}T${slot.start}:00-03:00`;
  if (!Number.isFinite(Date.parse(start)))
    return { error: "A data informada é inválida." };
  if (Date.parse(start) <= now.getTime())
    return {
      error: `O horário ${slot.start} de ${day.split("-").reverse().join("/")} já passou. Escolha uma data ou hora futura (horário de Brasília).`,
    };
  const duration = Number(slot.duration),
    interval = Number(slot.interval);
  if (
    String(slot.duration).trim() === "" ||
    !Number.isInteger(duration) ||
    duration < 15 ||
    duration > 180
  )
    return {
      error:
        "A duração deve ser um número inteiro entre 15 e 180 minutos. Exemplo: 50.",
    };
  if (
    String(slot.interval).trim() === "" ||
    !Number.isInteger(interval) ||
    interval < 0 ||
    interval > 120
  )
    return {
      error:
        "O intervalo deve ser um número inteiro entre 0 e 120 minutos. Exemplo: 10.",
    };
  if (!slot.instructor || !slot.vehicle || !["A", "B"].includes(slot.category))
    return { error: "Selecione a categoria, o instrutor e o veículo." };
  return {
    params: {
      p_instructor: slot.instructor,
      p_vehicle: slot.vehicle,
      p_category: slot.category,
      p_start: start,
      p_duration: duration,
      p_interval: interval,
    },
  };
}
