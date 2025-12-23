# Production Virtual Twin Presentation - Mode Collaboratif

Version collaborative de la présentation Production System avec synchronisation en temps réel via Supabase.

## Fonctionnalités

- **Synchronisation temps réel**: Tous les utilisateurs voient la même slide
- **Contrôle partagé**: N'importe quel utilisateur peut cliquer sur "Next" pour avancer
- **Pas de contrôleur unique**: Tous les utilisateurs ont les mêmes droits
- **Visibilité 3D synchronisée**: Les objets 3D du système de production s'affichent automatiquement via le SDK

## Configuration Supabase

### 1. Créer la table

La table `production_presentation_session` doit être créée dans Supabase avec la structure suivante:

```sql
-- Create production_presentation_session table
CREATE TABLE IF NOT EXISTS production_presentation_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_slide INTEGER NOT NULL DEFAULT -1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE production_presentation_session ENABLE ROW LEVEL SECURITY;

-- Allow all operations for everyone (collaborative presentation)
CREATE POLICY "Allow all operations for production_presentation_session"
ON production_presentation_session
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_production_presentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_production_presentation_session_updated_at
    BEFORE UPDATE ON production_presentation_session
    FOR EACH ROW
    EXECUTE FUNCTION update_production_presentation_updated_at();

-- Insert initial session row (only one session needed)
INSERT INTO production_presentation_session (current_slide)
VALUES (-1)
ON CONFLICT DO NOTHING;

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE production_presentation_session;
```

### 2. Configuration automatique

La configuration Supabase est déjà chargée via `supabase-config.js`:
- URL: https://jajibuwuhotlqyezliei.supabase.co
- Anon Key: Configurée automatiquement
- User ID: Généré automatiquement pour chaque session

### 3. Activer Real-time

Le Real-time doit être activé pour la table `production_presentation_session` dans les paramètres Supabase.

## Fonctionnement

### Comportement de synchronisation

1. **Utilisateurs présents depuis le début**: Avancent avec chaque clic sur "Next" ou "Restart"
2. **Nouveaux arrivants**:
   - Voient l'écran d'intro (slide -1)
   - Restent à l'écran d'intro
   - Ne rattrapent PAS automatiquement la présentation en cours
3. **Synchronisation limitée**:
   - ✅ Si quelqu'un clique "Next": tous les utilisateurs présents depuis le début avancent d'1 slide
   - ✅ Si quelqu'un clique "Restart": tous retournent au début
   - ❌ Pas de rattrapage automatique pour ceux qui arrivent tard

### Flux de synchronisation

1. **Initialisation**: Au chargement, chaque client se connecte à la même session Supabase
2. **Clic sur Next**: Le client met à jour `current_slide` dans Supabase
3. **Real-time sync**: Tous les autres clients qui étaient présents depuis le début reçoivent la mise à jour et avancent
4. **Nouveaux arrivants**: Les utilisateurs qui rejoignent tard voient l'écran d'intro et attendent le restart

## Objets 3D du système de production

La présentation contrôle la visibilité des objets suivants via le SDK:
- Manufacturing Sound
- AS IS Manufacturing
- PRD 1, PRD 2, PRD 3, PRD 4
- PRD Content

## Différences avec les autres versions

- **production-presentation-auto**: Défilement automatique avec timings fixes
- **production-presentation-collab**: Contrôle manuel partagé avec sync limitée (cette version)
- **production-presentation**: Version classique sans synchronisation

## Reset de la session

Pour réinitialiser la session (retour à la slide -1):

```sql
UPDATE production_presentation_session SET current_slide = -1;
```

## Dépendances

- Supabase JS v2 (chargé via CDN)
- Table `production_presentation_session` configurée dans Supabase
- Real-time activé pour la table

## Déploiement

Pour déployer sur GitHub Pages:

```bash
cd production-presentation-collab
git init
git add .
git commit -m "Initial commit: Production collaborative presentation"
gh repo create production-presentation-collab --public --source=. --remote=origin
git push -u origin main
gh api repos/quesdo/production-presentation-collab/pages -X POST -f source[branch]=main -f source[path]=/
```
