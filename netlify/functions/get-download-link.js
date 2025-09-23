// Arquivo: netlify/functions/get-download-link.js

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configura o cliente S3.
// Ele vai procurar automaticamente as variáveis AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY
// que o Netlify preparou para nós.
const s3Client = new S3Client({
  region: "sa-east-1", // Região do seu bucket. Confirme se é esta.
});

// Pega o nome do bucket da variável de ambiente
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Função principal que será executada
export const handler = async (event) => {
  // Pega o nome do arquivo da URL.
  // Ex: se a URL for "...?file=meu-livro.pdf", a variável fileName será "meu-livro.pdf"
  const fileName = event.queryStringParameters.file;

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "O nome do arquivo é obrigatório na URL (ex: ?file=nome.pdf)." }),
    };
  }
  
  if (!BUCKET_NAME) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "O nome do bucket S3 não está configurado nas variáveis de ambiente." }),
    };
  }

  // Prepara o comando para pedir o arquivo ao S3
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName, // O nome exato do arquivo no S3
  });

  try {
    // Gera a URL segura que expira em 60 segundos
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    // Envia a URL de volta para o navegador
    return {
      statusCode: 200,
      body: JSON.stringify({ downloadUrl: signedUrl }),
    };

  } catch (error) {
    console.error("Erro ao gerar URL:", error);
    // Se houver um erro (ex: arquivo não existe), retorna uma mensagem clara
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Não foi possível gerar o link. Verifique se o nome do arquivo está correto." }),
    };
  }
};
