# Blockly 13.4.0 (vendorizado)

Arquivos prontos para `<script>`, copiados sem alteração de `blockly@13.4.0` (npm, licença Apache-2.0, ver `LICENSE`) e dos plugins
`@blockly/field-colour@13.4.0` e `@blockly/field-angle@13.4.0` (Apache-2.0). Substitui o Blockly 6.20210701.0 que o BIPES usava
(`ui/core/blockly_compressed.js`, `blocks_compressed.js`, `python_compressed.js`, `javascript_compressed.js`, que continuam no
repositório até a migração ser aceita).

Para atualizar: `npm pack blockly@<versão>` e copiar os mesmos arquivos. Camada de compatibilidade do BIPES com o Blockly novo:
`../sancabot_blockly_compat.js`.
