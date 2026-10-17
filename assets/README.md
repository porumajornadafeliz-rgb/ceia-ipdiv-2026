# Logotipo oficial da Igreja

O logotipo já está incluído no projeto, a partir do PDF fornecido pelo usuário:

- `logo-original.pdf`: arquivo original `LOGO.pdf`, preservado integralmente.
- `logo.png`: conversão em PNG de **somente a página 1**, em 1600 × 1600 pixels.

O PDF recebido contém uma única página. A conversão preserva o desenho vetorial
renderizado, as cores, as proporções e o fundo branco; não houve redesenho da marca.
O cabeçalho enquadra a área do logotipo por CSS, aproveitando as margens brancas
sem alterar o arquivo da imagem.

O comando `npm run build` incorpora o PNG como data URL no arquivo `Brand.html`
de ambas as implantações. Não há dependência do Canva, publicação em Drive ou
requisição a um serviço externo para mostrar a marca. O PDF e o PNG acompanham
o código e o pacote de entrega.

Para reproduzir a conversão, caso necessário, com Poppler instalado:

```sh
pdftoppm -f 1 -l 1 -singlefile -scale-to 1600 -png assets/logo-original.pdf assets/logo
npm run build
```

A conversão só é necessária ao substituir o PDF. O build normal usa o PNG já
incluído e não depende de Poppler. Alternativamente, o build aceita `logo.jpg`
quando não existe `logo.png`.
