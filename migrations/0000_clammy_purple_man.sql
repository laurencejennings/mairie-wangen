CREATE TABLE `associations` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subtitle` text NOT NULL,
	`description` text NOT NULL,
	`contact_email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`object_key` text NOT NULL,
	`alt` text,
	`caption` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_event_media_event_kind` ON `event_media` (`event_id`,`kind`,`position`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`association_slug` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`time` text,
	`end_time` text,
	`time_label` text,
	`location` text NOT NULL,
	`description` text,
	`body` text,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`association_slug`) REFERENCES `associations`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_events_association_slug` ON `events` (`association_slug`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_events_association_date` ON `events` (`association_slug`,`date`,`time`);--> statement-breakpoint
CREATE INDEX `idx_events_published_date` ON `events` (`published`,`date`,`time`);

-- Seed current JSON content into D1.
INSERT INTO associations (slug, name, subtitle, description, contact_email) VALUES
  ('notrevillagemonvillage', 'Notre Village Mon Village', 'Animations locales et patrimoine vivant', 'L''association organise la Fête de la Musique, les Rendez vous aux Jardins, ainsi que d''autres événements dans le village.', 'contact-temporaire@nvmv-wangen.fr'),
  ('cercledhistoires', 'Cercle d''Histoires', 'Mémoire locale et transmission', 'Le Cercle d''Histoires collecte, raconte et partage les mémoires du territoire à travers des rencontres publiques.', NULL),
  ('commune', 'Commune de Wangen - Événements', 'Événements locaux et culturels', 'La commune de Wangen vous invite à découvrir ses événements locaux et culturels.', 'contact@mairie-wangen.fr');

INSERT INTO events (id, association_slug, slug, title, date, time, end_time, time_label, location, description, body, published) VALUES
  ('nvmv-rendezvous-aux-jardins-2026-06-07', 'notrevillagemonvillage', 'rendezvous-aux-jardins-2026', 'Rendez-vous aux jardins', '2026-06-07', '09:00', '17:00', '9h-17h', 'Niedertor, 44 Rue des Vignerons, Wangen', 'Une journée conviviale pour ouvrir les yeux sur les beautés de Wangen, entre promenades, points de vue, jardins ouverts et exposition photos.', '## Rendez-vous aux jardins

Le 7 juin 2026, l’association Nous voulons maintenir et valoriser organise à Wangen une journée dédiée aux jardins et aux beautés du village.

Au gré de circuits proposés à la promenade autour et dans le village médiéval, les visiteurs pourront découvrir de multiples points de vue sur les jardins de Wangen et visiter les jardins ouverts pour l’occasion.

Différents médias ayant trait à la vue seront également proposés, dont une exposition photos.

L’accueil se fera au Niedertor, près de la Mairie, au 44 Rue des Vignerons à Wangen.

Horaires indicatifs : 9h-17h.', 1),
  ('nvmv-fete-de-la-musique-2026-06-20', 'notrevillagemonvillage', 'fete-de-la-musique-2026', 'Fête de la musique', '2026-06-20', '19:15', NULL, 'à partir de 19h15', 'Cour de l''école, Wangen', 'Une soirée musicale conviviale à Wangen, organisée par NVMV en partenariat avec la Mairie, avec concerts, buvette et petite restauration.', '## Fête de la musique

Le samedi 20 juin 2026, NVMV présente, en partenariat avec la Mairie de Wangen, la Fête de la musique dans la cour de l''école.

À partir de 19h15, plusieurs groupes et musiciens se succéderont pour animer la soirée : Les Bloosbrieder, L''École de piano de Celia, Daniel & Hervé, Les Jazzeux du moulin, Sailor to Sirens, Les ménestrels ainsi que Koch''Leone et Invités.

Une buvette et une petite restauration seront proposées sur place. Les paiements par carte bancaire seront acceptés.

L''événement aura lieu dans la cour de l''école à Wangen.

Horaires indicatifs : à partir de 19h15.

La soirée sera annulée en cas de forte pluie.

Contact : 03 88 87 66 24.', 1),
  ('cdh-visite-historique-fete-fontaine-2026-07-05', 'cercledhistoires', 'visite-historique-fete-fontaine-2026-07-05', 'Visite historique du village', '2026-07-05', '14:30', NULL, 'à 14h30', 'Wangen', 'Une visite historique de Wangen proposée dans le cadre de la 199e Fête de la Fontaine.', '## Visite historique du village

Le dimanche 5 juillet 2026, une visite historique du village est proposée dans le cadre de la 199e Fête de la Fontaine.


Cette visite permet de découvrir l''histoire, le patrimoine et les particularités du village.', 1),
  ('cdh-visite-nocturne-wangen-2026-07-15', 'cercledhistoires', 'visite-nocturne-wangen-2026-07-15', 'Visite nocturne du village', '2026-07-15', '20:00', NULL, 'à 20h', 'Rendez-vous devant la Mairie, Wangen', 'Une visite nocturne de Wangen pour découvrir l''histoire et le patrimoine du village.', '## Visite nocturne du village

Le mercredi 15 juillet 2026, le Cercle d''Histoire de Wangen propose une visite nocturne du village.

Le rendez-vous est fixé à 20h devant la Mairie de Wangen.', 1),
  ('cdh-visite-nocturne-wangen-2026-07-29', 'cercledhistoires', 'visite-nocturne-wangen-2026-07-29', 'Visite nocturne du village', '2026-07-29', '20:00', NULL, 'à 20h', 'Rendez-vous devant la Mairie, Wangen', 'Une visite nocturne de Wangen pour découvrir l''histoire et le patrimoine du village.', '## Visite nocturne du village

Le mercredi 29 juillet 2026, le Cercle d''Histoire de Wangen propose une visite nocturne du village.

Le rendez-vous est fixé à 20h devant la Mairie de Wangen.', 1),
  ('cdh-visite-nocturne-wangen-2026-08-05', 'cercledhistoires', 'visite-nocturne-wangen-2026-08-05', 'Visite nocturne du village', '2026-08-05', '20:00', NULL, 'à 20h', 'Rendez-vous devant la Mairie, Wangen', 'Une visite nocturne de Wangen pour découvrir l''histoire et le patrimoine du village.', '## Visite nocturne du village

Le mercredi 5 août 2026, le Cercle d''Histoire de Wangen propose une visite nocturne du village.

Le rendez-vous est fixé à 20h devant la Mairie de Wangen.', 1),
  ('cdh-visite-nocturne-wangen-2026-08-19', 'cercledhistoires', 'visite-nocturne-wangen-2026-08-19', 'Visite nocturne du village', '2026-08-19', '20:00', NULL, 'à 20h', 'Rendez-vous devant la Mairie, Wangen', 'Une visite nocturne de Wangen pour découvrir l''histoire et le patrimoine du village.', '## Visite nocturne du village

Le mercredi 19 août 2026, le Cercle d''Histoire de Wangen propose une visite nocturne du village.

Le rendez-vous est fixé à 20h devant la Mairie de Wangen.', 1),
  ('bacchustours-2026-05-17', 'commune', 'bacchustours-2026-05-17', 'Bacchus Tour''S', '2026-05-17', '09:00', '17:00', '9h-17h', 'Wangen', 'Le Bacchus Tour''S : un événement sportif, festif et gratuit à Wangen.', '## Bacchus Tour''S : vélo, VTT ou randonnée

Pour la 4e édition du Bacchus Tour''S, la commune de Wangen invite le public à découvrir le village à travers des activités sportives, culturelles et conviviales.

Une visite du village et des remparts en alsacien sera proposée par le Cercle d''Histoire de Wangen, avec un rendez-vous à 14h30 à la Salle des Fêtes.

Les Bloosbrieder, un stammtisch et des artisans seront présents de 10h à 17h dans la cour de l''école.

### Parcours proposés

- **3 circuits vélo** : 8 km, 25 km et 32 km
- **2 circuits VTT** : 12 km et 41 km
- **4 circuits randonnée** : 8 km, 9 km, 12,5 km et 13,5 km

[Consulter toutes les informations pratiques](https://www.mossig-vignoble-tourisme.fr/bacchustours/)', 1),
  ('kermesse-enchantee-freihof-2026-05-23', 'commune', 'kermesse-enchantee-freihof-2026-05-23', 'La kermesse enchantée du Freihof', '2026-05-23', '11:30', '21:00', '11h30-21h', 'Le Freihof, 45 rue des Vignerons, 67520 Wangen', 'Le Freihof invite les habitants, familles et visiteurs à une journée festive, conviviale et solidaire à Wangen.', '## La kermesse enchantée du Freihof

Le Freihof vous invite à partager une journée placée sous le signe de la convivialité, de la fête et de la solidarité, dans une ambiance enchantée à l''entrée du village.

Familles, amis, voisins et visiteurs sont les bienvenus pour découvrir cet événement porté par les enfants, le personnel et les bénévoles du Freihof.

[Consulter toutes les informations sur la kermesse enchantée du Freihof sur le site Il était une fois Wangen](https://www.wangen-village.alsace/2026/04/13/la-kermesse-enchant%C3%A9-du-freihof-%C3%A0-wangen)', 1),
  ('journee-citoyenne-ramassage-dechets-2026-05-30', 'commune', 'journee-citoyenne-ramassage-dechets-2026-05-30', 'Journée citoyenne : ramassage des déchets', '2026-05-30', '09:00', '16:00', '9h-16h', 'Place de la Mairie, Wangen', 'La commune de Wangen invite habitants, familles, amis et voisins à participer à une journée citoyenne de ramassage des déchets.', '## Wangen : journée citoyenne

La commune de Wangen organise une journée citoyenne dédiée au ramassage des déchets.

L''objectif : nettoyer ensemble le village et agir collectivement pour un cadre de vie propre et agréable.

### Informations pratiques

- **Date** : samedi 30 mai 2026
- **Horaire** : de 9h à 16h
- **Rendez-vous** : Place de la Mairie à Wangen

Sacs et gants seront fournis sur place.

Une action de nettoyage de l''étang de l''Abbesse est également prévue l''après-midi.

Une petite restauration sera proposée au jardin de l''Abbesse et offerte uniquement aux participants.

Venez nombreux en famille, entre amis ou voisins.', 1),
  ('corridas-de-wangen-2026-06-06', 'commune', 'corridas-de-wangen-2026-06-06', 'Corridas de Wangen', '2026-06-06', '13:30', NULL, 'à partir de 13h30', 'Wangen', 'L''Association Sportive du Vignoble vous donne rendez-vous à Wangen pour la 13e et dernière édition des Corridas de Wangen.', '## Corridas de Wangen

Le 6 juin 2026, l''Association Sportive du Vignoble organise à Wangen la 13e et dernière édition des Corridas de Wangen.

Cet événement sportif et convivial propose des parcours accessibles à différents niveaux, au cœur du village et des paysages viticoles environnants.

Au programme : course découverte, course nature, trail, animations, restauration et soirée avec DJ.

[Consulter toutes les informations sur Il était une fois Wangen](https://www.wangen-village.alsace/2026/06/06/corridas-de-wangen)

[Informations officielles et inscriptions](https://www.finishers.com/course/corridas-de-wangen)', 1),
  ('fete-de-lecole-2026-06-19', 'commune', 'fete-de-lecole-2026-06-19', 'Fête de l''École', '2026-06-19', '18:15', NULL, 'à 18h15', 'Salle des Fêtes, Wangen', 'La Fête de l''École se tiendra à la Salle des Fêtes de Wangen.', '## Fête de l''École

La Fête de l''École aura lieu le vendredi 19 juin 2026 à la Salle des Fêtes de Wangen.

Le rendez-vous est fixé à 18h15.', 1),
  ('marathon-du-vignoble-2026-06-21', 'commune', 'marathon-du-vignoble-2026-06-21', 'Marathon du Vignoble', '2026-06-21', '09:00', '14:30', '9h-14h30', 'Wangen', 'Le Marathon du Vignoble traversera Wangen dans une ambiance sportive et festive.', '## Marathon du Vignoble

Le dimanche 21 juin 2026, le Marathon du Vignoble se déroulera à Wangen.

L''événement est annoncé de 9h à 14h30.', 1),
  ('fete-de-la-fontaine-2026-07-05', 'commune', 'fete-de-la-fontaine-2026-07-05', '199e Fête de la Fontaine', '2026-07-05', '10:30', NULL, 'à partir de 10h30', 'Centre du village, Wangen', 'La 199e Fête de la Fontaine propose cérémonie, démonstrations, expositions, fête foraine, restauration, visite historique, concert et bal.', '## 199e Fête de la Fontaine

Le dimanche 5 juillet 2026, Wangen célèbre la 199e édition de la Fête de la Fontaine.

Le rendez-vous est fixé à 10h30 devant la Mairie pour la cérémonie à la fontaine.

### Programme

- Artisans et démonstrations
- Vol immersif par drone
- Expositions de photos
- Fête foraine
- Restauration le midi
- Salon de thé l''après-midi
- Visite historique du village à 14h30
- Concert du Trio vocal à 17h
- Soirée tartes flambées et bal

Plusieurs solutions de restauration seront proposées dans le village. Certains repas devront être réservés à l''avance.

Les livrets détaillant l''organisation seront distribués dans les boîtes aux lettres. Les informations seront également publiées sur la page Facebook « Commune de Wangen ».', 1),
  ('fete-de-la-fontaine-2026-07-06', 'commune', 'fete-de-la-fontaine-2026-07-06', '199e Fête de la Fontaine — lundi', '2026-07-06', '17:00', NULL, 'à partir de 17h', 'Centre du village, Wangen', 'La Fête de la Fontaine se poursuit avec la fête foraine, une soirée tartes flambées et un bal.', '## 199e Fête de la Fontaine — lundi

La 199e Fête de la Fontaine se poursuit le lundi 6 juillet 2026 à Wangen.

La fête foraine ouvrira à partir de 17h.

La soirée se prolongera autour de tartes flambées et d''un bal.', 1),
  ('bar-nomade-wangen-2026-07-10', 'commune', 'bar-nomade-wangen-2026-07-10', 'Bärr Nomade', '2026-07-10', '18:00', '22:00', '18h-22h', 'Place de l''Église, Wangen', 'Le Bärr Nomade s''installe sur la Place de l''Église pour une soirée conviviale.', '## Bärr Nomade

Le vendredi 10 juillet 2026, le Bärr Nomade s''installera sur la Place de l''Église à Wangen.

L''événement se tiendra de 18h à 22h.', 1),
  ('bar-ephemere-cave-thierry-martin-2026-07-10', 'commune', 'bar-ephemere-cave-thierry-martin-2026-07-10', 'Bar éphémère à la Cave Thierry Martin', '2026-07-10', '18:30', NULL, 'à partir de 18h30', 'Cave Thierry Martin, Wangen', 'La Cave Thierry Martin ouvre un bar éphémère à Wangen.', '## Bar éphémère à la Cave Thierry Martin

Le vendredi 10 juillet 2026, un bar éphémère sera proposé à la Cave Thierry Martin à Wangen.

Ouverture à partir de 18h30.', 1),
  ('bal-retraite-flambeaux-2026-07-13', 'commune', 'bal-retraite-flambeaux-2026-07-13', 'Bal et retraite aux flambeaux', '2026-07-13', '18:30', NULL, 'restauration à partir de 18h30', 'Wangen', 'Une soirée festive avec restauration, retraite aux flambeaux et animation musicale.', '## Bal et retraite aux flambeaux

Le lundi 13 juillet 2026, Wangen organise une soirée festive avec un bal et une retraite aux flambeaux.

La restauration sera proposée à partir de 18h30.

L''animation musicale sera assurée par DB Events et Les Bloosbrieder.', 1),
  ('bar-ephemere-cave-thierry-martin-2026-07-17', 'commune', 'bar-ephemere-cave-thierry-martin-2026-07-17', 'Bar éphémère à la Cave Thierry Martin', '2026-07-17', '18:30', NULL, 'à partir de 18h30', 'Cave Thierry Martin, Wangen', 'La Cave Thierry Martin ouvre un bar éphémère à Wangen.', '## Bar éphémère à la Cave Thierry Martin

Le vendredi 17 juillet 2026, un bar éphémère sera proposé à la Cave Thierry Martin à Wangen.

Ouverture à partir de 18h30.', 1),
  ('bar-ephemere-cave-thierry-martin-2026-07-24', 'commune', 'bar-ephemere-cave-thierry-martin-2026-07-24', 'Bar éphémère à la Cave Thierry Martin', '2026-07-24', '18:30', NULL, 'à partir de 18h30', 'Cave Thierry Martin, Wangen', 'La Cave Thierry Martin ouvre un bar éphémère à Wangen.', '## Bar éphémère à la Cave Thierry Martin

Le vendredi 24 juillet 2026, un bar éphémère sera proposé à la Cave Thierry Martin à Wangen.

Ouverture à partir de 18h30.', 1),
  ('bar-ephemere-cave-thierry-martin-2026-08-07', 'commune', 'bar-ephemere-cave-thierry-martin-2026-08-07', 'Bar éphémère à la Cave Thierry Martin', '2026-08-07', '18:30', NULL, 'à partir de 18h30', 'Cave Thierry Martin, Wangen', 'La Cave Thierry Martin ouvre un bar éphémère à Wangen.', '## Bar éphémère à la Cave Thierry Martin

Le vendredi 7 août 2026, un bar éphémère sera proposé à la Cave Thierry Martin à Wangen.

Ouverture à partir de 18h30.', 1),
  ('bar-ephemere-cave-thierry-martin-2026-08-14', 'commune', 'bar-ephemere-cave-thierry-martin-2026-08-14', 'Bar éphémère à la Cave Thierry Martin', '2026-08-14', '18:30', NULL, 'à partir de 18h30', 'Cave Thierry Martin, Wangen', 'La Cave Thierry Martin ouvre un bar éphémère à Wangen.', '## Bar éphémère à la Cave Thierry Martin

Le vendredi 14 août 2026, un bar éphémère sera proposé à la Cave Thierry Martin à Wangen.

Ouverture à partir de 18h30.', 1);

-- Upcoming events announced in bulletin communal no. 003 - August 2026.
-- When the bulletin does not name an organiser, the existing municipal organiser
-- `commune` (Commune de Wangen / mairie) is used.
INSERT INTO events (id, association_slug, slug, title, date, time, end_time, time_label, location, description, body, published) VALUES
  ('reunion-confirmation-2026-09-16', 'commune', 'reunion-confirmation-2026-09-16', 'Réunion de préparation à la confirmation', '2026-09-16', '20:00', NULL, 'à 20h', 'Foyer Sainte-Richarde', 'Réunion destinée aux enfants nés en 2013 ou avant et à leurs familles.', '## Réunion de préparation à la confirmation

La paroisse catholique organise une réunion de préparation à la confirmation le mercredi 16 septembre 2026 à 20h au Foyer Sainte-Richarde.

Cette rencontre concerne les enfants nés en 2013 ou avant et leurs familles.', 1),
  ('journees-patrimoine-ecoliers-2026-09-18', 'cercledhistoires', 'journees-patrimoine-ecoliers-2026-09-18', 'Journées du patrimoine avec les écoliers', '2026-09-18', NULL, NULL, 'dans la journée', 'Wangen et jardin du château', 'Une journée de découverte du patrimoine de Wangen pour les élèves de maternelle et de primaire.', '## Journées du patrimoine avec les écoliers

Le vendredi 18 septembre 2026, le Cercle d''Histoire(s) de Wangen passera la journée avec les élèves de maternelle et de primaire.

Au programme : rallye-photo sur les sites remarquables du village, goûter au jardin du château, vidéo présentant une reconstitution du château et exposition d''une maquette réalisée par d''anciens écoliers.', 1),
  ('reunion-premiere-communion-2026-09-18', 'commune', 'reunion-premiere-communion-2026-09-18', 'Réunion de préparation à la première communion', '2026-09-18', '20:00', NULL, 'à 20h', 'Foyer Sainte-Richarde', 'Réunion destinée aux enfants nés en 2016 ou avant et à leurs familles.', '## Réunion de préparation à la première communion

La paroisse catholique organise une réunion de préparation à la première communion le vendredi 18 septembre 2026 à 20h au Foyer Sainte-Richarde.

Cette rencontre concerne les enfants nés en 2016 ou avant et leurs familles.', 1),
  ('journees-patrimoine-visite-wangen-2026-09-19', 'cercledhistoires', 'journees-patrimoine-visite-wangen-2026-09-19', 'Visite de Wangen - Journées européennes du patrimoine', '2026-09-19', '16:00', NULL, 'à partir de 16h', 'Jardin de l''Abbesse, Wangen', 'Une visite consacrée au château disparu, au Schlossturm et à la préservation du patrimoine, suivie d''une soirée tartes flambées.', '## Visite de Wangen - Journées européennes du patrimoine

Le samedi 19 septembre 2026, le Cercle d''Histoire(s) propose une visite du village à l''occasion des Journées européennes du patrimoine.

Rendez-vous à 16h au jardin de l''Abbesse pour découvrir une exposition photographique sur la restauration du Schlossturm. Le parcours se poursuivra au centre du village, à l''emplacement de l''ancien château de Wangen, avec une seconde exposition et une maquette du château réalisée par des enfants du village.

Cette édition s''inscrit dans le thème « Le patrimoine en péril : raviver, résister, réinventer ».

La visite sera suivie d''une soirée tartes flambées organisée par les D''Wangemer Essel.

Plus d''informations : https://www.histoire-wangen.alsace', 1),
  ('messe-wangen-2026-09-19', 'commune', 'messe-wangen-2026-09-19', 'Messe à Wangen', '2026-09-19', '18:00', NULL, 'à 18h', 'Église de Wangen', 'La paroisse catholique célèbre une messe à Wangen.', '## Messe à Wangen

Une messe catholique sera célébrée à Wangen le samedi 19 septembre 2026 à 18h.', 1),
  ('reunion-inter-associations-2026-09-22', 'commune', 'reunion-inter-associations-2026-09-22', 'Réunion inter-associations', '2026-09-22', '20:00', NULL, 'à partir de 20h', 'Salle des Fêtes, Wangen', 'Une réunion ouverte aux membres des associations du village pour préparer les futures fêtes.', '## Réunion inter-associations

Tous les membres des associations de Wangen sont conviés à une réunion le mardi 22 septembre 2026 à partir de 20h à la Salle des Fêtes.

Cette rencontre permettra de constituer un bureau inter-associations et de préparer les futures fêtes du village, notamment le Marché de Noël et la Fête de la Fontaine.', 1),
  ('barr-nomade-wangen-2026-10-02', 'commune', 'barr-nomade-wangen-2026-10-02', 'Bärr Nomade', '2026-10-02', '18:00', '22:00', '18h-22h', 'Place de l''Église, Wangen', 'Le Bärr Nomade s''installe sur la Place de l''Église pour une soirée conviviale.', '## Bärr Nomade

Le vendredi 2 octobre 2026, le Bärr Nomade s''installera sur la Place de l''Église à Wangen, de 18h à 22h.', 1),
  ('repas-paroisse-protestante-2026-10-04', 'commune', 'repas-paroisse-protestante-2026-10-04', 'Repas de la paroisse protestante', '2026-10-04', '12:00', NULL, 'à 12h', 'Salle des Fêtes, Wangen', 'La paroisse protestante organise un repas à la Salle des Fêtes de Wangen.', '## Repas de la paroisse protestante

La paroisse protestante organise un repas le dimanche 4 octobre 2026 à 12h à la Salle des Fêtes de Wangen.', 1),
  ('messe-reconnaissance-vignoble-mossig-2026-10-11', 'commune', 'messe-reconnaissance-vignoble-mossig-2026-10-11', 'Messe de reconnaissance de la nouvelle communauté de paroisses', '2026-10-11', '10:00', NULL, 'à 10h', 'Marlenheim', 'Une messe présidée par l''archevêque officialisera la communauté de paroisses du Vignoble et de la Mossig.', '## Messe de reconnaissance

La création de la communauté de paroisses du « Vignoble et de la Mossig », placée sous le patronage de sainte Faustine, deviendra effective lors d''une messe de reconnaissance.

La célébration sera présidée par l''archevêque Pascal Delannoy le dimanche 11 octobre 2026 à 10h à Marlenheim.', 1),
  ('reunion-conseil-des-jeunes-2026-10-16', 'commune', 'reunion-conseil-des-jeunes-2026-10-16', 'Création du Conseil municipal des Jeunes', '2026-10-16', '19:00', NULL, 'à 19h', 'Wangen - lieu à confirmer', 'Une réunion destinée aux jeunes de 12 à 17 ans pour créer un nouveau Conseil municipal des Jeunes.', '## Création du Conseil municipal des Jeunes

La commune organise une réunion le vendredi 16 octobre 2026 à 19h avec les jeunes de Wangen âgés de 12 à 17 ans.

Ils pourront proposer leurs idées et leurs envies pour animer le village. Le bulletin ne précise pas le lieu de rendez-vous.', 1),
  ('repair-cafe-2026-10-17', 'commune', 'repair-cafe-2026-10-17', 'Repair Café', '2026-10-17', '09:00', '17:00', '9h-12h et 14h-17h', 'Wangen - lieu à confirmer', 'Un atelier gratuit et sans rendez-vous pour réparer des objets avec l''aide de bénévoles.', '## Repair Café

L''AGF organise un Repair Café le samedi 17 octobre 2026, de 9h à 12h puis de 14h à 17h. L''entrée est libre et sans rendez-vous.

Des réparateurs bénévoles, des outils et du matériel seront disponibles pour tenter de donner une seconde vie aux objets en panne ou en mauvais état. Le bulletin ne précise pas le lieu.', 1),
  ('barr-nomade-wangen-2026-10-30', 'commune', 'barr-nomade-wangen-2026-10-30', 'Bärr Nomade', '2026-10-30', '18:00', '22:00', '18h-22h', 'Place de l''Église, Wangen', 'Le Bärr Nomade s''installe sur la Place de l''Église pour une soirée conviviale.', '## Bärr Nomade

Le vendredi 30 octobre 2026, le Bärr Nomade s''installera sur la Place de l''Église à Wangen, de 18h à 22h.', 1),
  ('fete-de-la-fontaine-2027-07-04', 'commune', 'fete-de-la-fontaine-2027-07-04', '200e Fête de la Fontaine', '2027-07-04', NULL, NULL, NULL, 'Centre du village, Wangen', 'Wangen célébrera la 200e édition de la Fête de la Fontaine les 4 et 5 juillet 2027.', '## 200e Fête de la Fontaine

Wangen célébrera la 200e édition de la Fête de la Fontaine les dimanche 4 et lundi 5 juillet 2027.

Le programme et les horaires seront annoncés ultérieurement.', 1),
  ('fete-de-la-fontaine-2027-07-05', 'commune', 'fete-de-la-fontaine-2027-07-05', '200e Fête de la Fontaine - lundi', '2027-07-05', NULL, NULL, NULL, 'Centre du village, Wangen', 'La 200e Fête de la Fontaine se poursuivra le lundi 5 juillet 2027.', '## 200e Fête de la Fontaine - lundi

La 200e Fête de la Fontaine se poursuivra à Wangen le lundi 5 juillet 2027.

Le programme et les horaires seront annoncés ultérieurement.', 1);

INSERT INTO event_media (event_id, kind, position, object_key, alt, caption) VALUES
  ('nvmv-rendezvous-aux-jardins-2026-06-07', 'banner', 0, 'events/notrevillagemonvillage/rendezvous-aux-jardins-2026/banner.jpg', NULL, NULL),
  ('nvmv-rendezvous-aux-jardins-2026-06-07', 'main', 0, 'events/notrevillagemonvillage/rendezvous-aux-jardins-2026/main.jpg', NULL, NULL),
  ('nvmv-fete-de-la-musique-2026-06-20', 'banner', 0, 'events/notrevillagemonvillage/fete-de-la-musique-2026/banner.jpg', NULL, NULL),
  ('nvmv-fete-de-la-musique-2026-06-20', 'main', 0, 'events/notrevillagemonvillage/fete-de-la-musique-2026/main.jpg', NULL, NULL),
  ('bacchustours-2026-05-17', 'banner', 0, 'events/commune/bacchustours-2026-05-17/banner.png', NULL, NULL),
  ('kermesse-enchantee-freihof-2026-05-23', 'main', 0, 'events/commune/kermesse-enchantee-freihof-2026-05-23/main.png', NULL, NULL),
  ('journee-citoyenne-ramassage-dechets-2026-05-30', 'main', 0, 'events/commune/journee-citoyenne-ramassage-dechets-2026-05-30/main.jpeg', NULL, NULL),
  ('corridas-de-wangen-2026-06-06', 'main', 0, 'events/commune/corridas-de-wangen-2026-06-06/main.jpg', NULL, NULL);
