CREATE OR REPLACE VIEW ViewAlbumIArtist AS
SELECT
A.title,
A.release,
AA.AlbumId,
AA.ArtistId,
AA.order
FROM Albums A
INNER JOIN AlbumArtists AA
ON A.id = AA.AlbumId;

CREATE OR REPLACE VIEW ViewAlbumIArtistI AS
SELECT
A.name,
AA.ArtistId,
AA.title,
AA.release,
AA.AlbumId,
AA.order
FROM Artists A
INNER JOIN ViewAlbumIArtist AA
ON A.id = AA.ArtistId;

CREATE OR REPLACE VIEW ViewSongArtistI AS
SELECT
A.name,
SA.ArtistId,
SA.SongId,
SA.order,
SA.feat
FROM Artists A
INNER JOIN SongArtists SA
ON A.id = SA.ArtistId;

CREATE OR REPLACE VIEW ViewSongIArtistI AS
SELECT
S.title,
SA.SongId,
SA.name,
SA.ArtistId,
SA.order,
SA.feat
FROM Songs S
INNER JOIN ViewSongArtistI SA
ON S.id = SA.SongId;

CREATE OR REPLACE VIEW ViewAlbumIArtistISong AS
SELECT
AA.name,
AA.ArtistId,
AA.title,
AA.release,
AA.AlbumId,
AA.order,
AlbumSongs.SongId,
AlbumSongs.track
FROM ViewAlbumIArtistI AA
INNER JOIN AlbumSongs
ON AA.AlbumId = AlbumSongs.AlbumId;

CREATE OR REPLACE VIEW ViewAlbumIArtistISongIArtistI AS
SELECT
AAS.name as albumArtistName,
AAS.ArtistId as albumArtistId,
AAS.title as albumTitle,
AAS.release,
AAS.AlbumId,
AAS.order as albumArtistOrder,
AAS.SongId,
AAS.track,
SA.title as songTitle,
SA.name as songArtistName,
SA.ArtistId as songArtistId,
SA.order as songArtistOrder,
SA.feat
FROM ViewAlbumIArtistISong AAS
INNER JOIN ViewSongIArtistI SA
ON AAS.SongId = SA.songId
