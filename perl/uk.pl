use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];

my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( days => 6 );
my $ld_ymd = $ld->ymd('');

my $url = "http://www.officialcharts.com/charts/singles-chart/$ld_ymd/7501";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="title-artist"]')->each) {
	my $title_norm;
	if ($div->find('div[class="title"]')->first) {
		my $title = $div->find('div[class="title"]')->first->find('a')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('div[class="artist"]')->first) {
		my $artist = $div->find('div[class="artist"]')->first->find('a')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub get_artist_from_url($)
{
	my $artist = shift;

	$artist =~ s/^.*\///;
	$artist =~ s/-/ /g;

	return $artist;
}

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\(.*\)//g;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	$string =~ s/F\*\*K/FUCK/g;
	
	if ($string =~ /^DJ GOT US FALLING IN LOVE$/) { return "DJ Got Us Fallin` In Love"; }
	if ($string =~ /^ET$/) { return "E.T."; }
	if ($string =~ /^GANGNAM STYLE$/) { return "강남스타일"; }
	if ($string =~ /^FORGET YOU$/) { return "FUCK YOU"; }
	if ($string =~ /^FOURFIVE SECONDS$/) { return "FOURFIVESECONDS"; }
	if ($string =~ /^HOLD ON WE`RE GOING HOME$/) { return "Hold On, We`re Going Home"; }
	if ($string =~ /^I DON`T LIKE IT I LOVE IT$/) { return "I Don`t Like It, I Love It"; }
	if ($string =~ /^MR KNOW IT ALL$/) { return "Mr. Know It All"; }
	if ($string =~ /^N\*\*\*\*S IN PARIS$/) { return "Ni\*\*as In Paris"; }
	if ($string =~ /^OOPS! I DID IT AGAIN$/) { return "Oops!... I Did It Again"; }
	if ($string =~ /^SHUT UP & DANCE$/) { return "Shut Up And Dance"; }
	if ($string =~ /^THATPOWER$/) { return "#thatPOWER"; }
	if ($string =~ /^YOU NEED ME I DON`T NEED YOU$/) { return "You Need Me, I Don`t Need You"; }

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^BARS & MELODY/) { return "Bars & Melody"; }
	if ($string =~ /^CHASE & STATUS/) { return "Chase & Status"; }
	if ($string =~ /^FAUL & WAD AD/) { return "Faul & Wad Ad"; }
	if ($string =~ /^FLORENCE & THE MACHINE$/) { return "Florence + the Machine"; }
	if ($string =~ /^FLORENCE\/DIZZEE RASCAL$/) { return "Florence + the Machine"; }
	if ($string =~ /^LILLY WOOD & ROBIN SCHULZ$/) { return "Lilly Wood & the Prick"; }
	if ($string =~ /^MUMFORD & SONS$/) { return $string; }
	if ($string =~ /^NICO & VINZ$/) { return $string; }
	if ($string =~ /^SAM & THE WOMP$/) { return $string; }
	if ($string =~ /^WAZE & ODYSSEY/) { return "Waze & Odyssey"; }
	if ($string =~ /^YEARS & YEARS$/) { return $string; }
	if ($string =~ /^AC\/DC$/) { return $string; }
	if ($string =~ /^SHOUT FT DIZZEE & JAMES CORDEN$/) { return "Shout For England"; }
	
	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\/.*$//;
	$string =~ s/\sFT\s.*$//;
	$string =~ s/\sVS\s.*$//;
	$string =~ s/\s+$//;

	if ($string =~ /^BLACK EYED PEAS$/) { return "The Black Eyed Peas"; }
	if ($string =~ /^BOB$/) { return "B.o.B"; }
	if ($string =~ /^CHERYL COLE$/) { return "CHERYL"; }
	if ($string =~ /^DISCLOSURE$/) { return "The Disclosure"; }
	if ($string =~ /^DR DRE$/) { return "Dr. Dre"; }
	if ($string =~ /^DR KUCHO$/) { return "Dr. Kucho!"; }
	if ($string =~ /^FATBOYSLIM$/) { return "Fatboy Slim"; }
	if ($string =~ /^FUN$/) { return "Fun."; }
	if ($string =~ /^JAY-Z$/) { return "JAY Z"; }
	if ($string =~ /^KESHA$/) { return "Ke\$ha"; }
	if ($string =~ /^LUMINEERS$/) { return "The Lumineers"; }
	if ($string =~ /^MAGIC$/) { return "MAGIC!"; }
	if ($string =~ /^MAGICIAN$/) { return "The Magician"; }
	if ($string =~ /^PINK$/) { return "P!nk"; }
	if ($string =~ /^PSY$/) { return "싸이"; }
	if ($string =~ /^SATURDAYS$/) { return "The Saturdays"; }
	if ($string =~ /^SCRIPT$/) { return "The Script"; }
	if ($string =~ /^S INGROSSO$/) { return "Sebastian Ingrosso"; }
	if ($string =~ /^VAMPS$/) { return "The Vamps"; }
	if ($string =~ /^WANTED$/) { return "The Wanted"; }
	if ($string =~ /^WEEKND$/) { return "The Weeknd"; }
	if ($string =~ /^WILL I AM$/) { return "Will.I.Am"; }
	
	return $string;
}
