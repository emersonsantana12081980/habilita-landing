export async function deleteStudent(client, studentId) {
  const prepared = await client.rpc('admin_prepare_student_deletion', { p_student: studentId });
  if (prepared.error) throw prepared.error;
  const buckets = new Map();
  for (const file of prepared.data || []) {
    if (!buckets.has(file.bucket)) buckets.set(file.bucket, []);
    buckets.get(file.bucket).push(file.path);
  }
  for (const [bucket, paths] of buckets) {
    for (let offset = 0; offset < paths.length; offset += 100) {
      const { error } = await client.storage.from(bucket).remove(paths.slice(offset, offset + 100));
      if (error) throw error;
    }
  }
  const { error } = await client.rpc('admin_finish_student_deletion', { p_student: studentId });
  if (error) throw error;
}
