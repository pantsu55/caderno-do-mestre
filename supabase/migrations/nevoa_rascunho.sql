-- (Já aplicada no projeto; guardada como registro.)
-- rascunho da névoa: o Mestre revela/esconde à vontade e só publica quando salvar (a tabela maps é só do Mestre)
alter table public.maps add column fog_draft text check (fog_draft is null or char_length(fog_draft) <= 60000);
