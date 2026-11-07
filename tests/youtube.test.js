import {test} from 'node:test';
import assert from 'node:assert/strict';
import {youtubeId} from '../src/lib/youtube.js';
test('YouTube aceita vídeo comum, compartilhamento, Shorts e embed',()=>{
 for(const url of ['https://www.youtube.com/watch?v=abcdefghijk&t=20','https://youtu.be/abcdefghijk?si=share','https://youtube.com/shorts/abcdefghijk','https://www.youtube-nocookie.com/embed/abcdefghijk'])assert.equal(youtubeId(url),'abcdefghijk');
});
test('YouTube rejeita hosts falsos, credenciais, HTML e identificadores inválidos',()=>{
 for(const url of ['',null,'javascript:alert(1)','https://youtube.com.evil.com/watch?v=abcdefghijk','https://evil.com/embed/abcdefghijk','https://user:secret@youtube.com/watch?v=abcdefghijk','http://youtube.com/watch?v=abcdefghijk','https://youtube.com/watch?v=short','<iframe src="x">','https://youtu.be/abcdefghijk/extra'])assert.equal(youtubeId(url),null);
});
