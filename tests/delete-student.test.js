import test from 'node:test';
import assert from 'node:assert/strict';
import {deleteStudent} from '../src/lib/delete-student.js';

test('remove arquivos em lotes antes de finalizar a exclusão',async()=>{
 const calls=[];
 const client={rpc:async(name,args)=>{calls.push([name,args]);return {data:name.includes('prepare')?Array.from({length:101},(_,i)=>({bucket:'student-ladv',path:`s/A/${i}.pdf`})) : null};},storage:{from:bucket=>({remove:async paths=>{calls.push([bucket,paths]);return {};}})}};
 await deleteStudent(client,'s');
 assert.equal(calls[0][0],'admin_prepare_student_deletion');
 assert.equal(calls[1][1].length,100);assert.equal(calls[2][1].length,1);
 assert.deepEqual(calls[3],['admin_finish_student_deletion',{p_student:'s'}]);
});
test('negação na preparação não remove arquivos nem finaliza',async()=>{
 const client={rpc:async()=>({error:new Error('admin_required')}),storage:{from:()=>assert.fail('Não deve acessar storage')}};
 await assert.rejects(deleteStudent(client,'s'),/admin_required/);
});
test('erro de armazenamento mantém dados e permite repetir',async()=>{
 let fail=true,finish=0;
 const client={rpc:async name=>{if(name.includes('finish'))finish++;return {data:[{bucket:'package-receipts',path:'r/file.pdf'}]};},storage:{from:()=>({remove:async()=>({error:fail?new Error('offline'):null})})}};
 await assert.rejects(deleteStudent(client,'s'),/offline/);assert.equal(finish,0);
 fail=false;await deleteStudent(client,'s');assert.equal(finish,1);
});
test('erro ao finalizar não é anunciado como sucesso',async()=>{
 const client={rpc:async name=>name.includes('prepare')?{data:[]}:{error:new Error('student_files_remaining')}};
 await assert.rejects(deleteStudent(client,'s'),/student_files_remaining/);
});
