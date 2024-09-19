import { annotate } from 'rough-notation';
// Or using unpkg
// import { annotate } from 'https://unpkg.com/rough-notation?module';

const e = document.querySelector('#myElement');
const annotation = annotate(e, { type: 'underline' });
annotation.show();