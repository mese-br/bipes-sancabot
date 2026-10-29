DIR=ui/core
FILES_WEBREPL=FileSaver.js term.js

# O Blockly NÃO vem mais de um submódulo nem de "git clone": a versão 13.4.0 está dentro do repositório,
# em ui/core/blockly13/ e ui-v4/core/blockly13/ (ver docs/projeto/ARQUITETURA.md).
# Para atualizar o Blockly, troque os arquivos dessas pastas por uma versão publicada (tag blockly-vX.Y.Z) e rode os testes.

# Copia as dependências que ainda vêm do submódulo webrepl (inicialize com: git submodule update --init webrepl).
copy:
	cd webrepl; cp -pr $(FILES_WEBREPL) ../$(DIR)/

copy-bipes-blocks:
	cp bipes_blocks/block_definitions.js ui/
	echo "Please, add <>"



offline:
	echo "Generating offline version"
	echo > ui/index_offline.html
	cat ui/index.html >> ui/index_offline.html
	for i in ui/toolbox/*.xml ; do \
		echo "Including file $$i" ; \
		echo -n "<document style='display: none' id='"OFFLINE_ >> ui/index_offline.html ; \
		echo -n $$i | sed -e 's/[\/\.]/_/g' -e 's/ui_//g' >> ui/index_offline.html ; \
		echo  "'>" >> ui/index_offline.html ;\
		cat $$i | grep -v "<document>" >> ui/index_offline.html ; \
	done
	echo "<script>" >> ui/index_offline.html
	echo "OFFLINE_devinfo_devinfo_json = \`" >> ui/index_offline.html
	cat ui/devinfo/devinfo.json >> ui/index_offline.html
	echo "\`;" >> ui/index_offline.html
	echo "</script>" >> ui/index_offline.html
	zip -q -r bipes_offline.zip *

 doc:
	cd docs && make html
