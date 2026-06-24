const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const certPath = path.join(dir, 'cert.pem');
const keyPath = path.join(dir, 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('Certificates exist, skipping generation');
  process.exit(0);
}

const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'organizationName', value: 'Blender to Web Local' },
];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([
  { name: 'subjectAltName', altNames: [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
  ]},
]);

cert.sign(keys.privateKey, forge.md.sha256.create());

fs.writeFileSync(certPath, forge.pki.certificateToPem(cert));
fs.writeFileSync(keyPath, forge.pki.privateKeyToPem(keys.privateKey));

console.log('Self-signed certificates generated for localhost');