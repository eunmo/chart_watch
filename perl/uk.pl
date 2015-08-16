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
my $count = 1;

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
	my @tokens = split(/\//, $title_norm);
	foreach my $title_token (@tokens) {
		my $token_norm = normalize_title($title_token);
		print ",\n" if $count > 1;
		print "{ \"rank\": $rank, \"song\": \"$token_norm\", \"artist\": \"$artist_norm\" }";
		$count++;
	}
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
	$string =~ s/^\s+//g;
	$string =~ s/[\'’]/`/g;
	$string =~ s/F\*\*K/FUCK/g;
	
	if ($string =~ /^AMARILLO$/) { return "Is This the Way to Amarillo"; }
	if ($string =~ /^DJ GOT US FALLING IN LOVE$/) { return "DJ Got Us Fallin` In Love"; }
	if ($string =~ /^ET$/) { return "E.T."; }
	if ($string =~ /^GANGNAM STYLE$/) { return "강남스타일"; }
	if ($string =~ /^FORGET YOU$/) { return "FUCK YOU"; }
	if ($string =~ /^FOURFIVE SECONDS$/) { return "FOURFIVESECONDS"; }
	if ($string =~ /^HOLD ON WE`RE GOING HOME$/) { return "Hold On, We`re Going Home"; }
	if ($string =~ /^I DON`T LIKE IT I LOVE IT$/) { return "I Don`t Like It, I Love It"; }
	if ($string =~ /^LUV ME LUV ME$/) { return "Luv Me, Luv Me"; }
	if ($string =~ /^MR KNOW IT ALL$/) { return "Mr. Know It All"; }
	if ($string =~ /^N\*\*\*\*S IN PARIS$/) { return "Ni\*\*as In Paris"; }
	if ($string =~ /^OOPS! I DID IT AGAIN$/) { return "Oops!... I Did It Again"; }
	if ($string =~ /^PLEASE PLEASE$/) { return "Please, Please"; }
	if ($string =~ /^SORRY`S NOT GOOD ENOUGH$/) { return "Sorry`s Not Good Enough/Friday Night"; }
	if ($string =~ /^SEXY CHICK$/) { return "Sexy Bitch"; }
	if ($string =~ /^SHUT UP & DANCE$/) { return "Shut Up And Dance"; }
	if ($string =~ /^THATPOWER$/) { return "#thatPOWER"; }
	if ($string =~ /^YOU NEED ME I DON`T NEED YOU$/) { return "You Need Me, I Don`t Need You"; }
	if ($string =~ /^WHAT GOES AROUND COMES AROUND$/) { return "What Goes Around...Comes Around"; }

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
	if ($string =~ /^SAM & MARK$/) { return $string; }
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
	$string =~ s/\sPTS\s.*$//;
	$string =~ s/\sVS\s.*$//;
	$string =~ s/\sWITH\s.*$//;
	$string =~ s/\s+$//;
	$string =~ s/[\'’]/`/g;

	if ($string =~ /^BLACK EYED PEAS$/) { return "The Black Eyed Peas"; }
	if ($string =~ /^BOB$/) { return "B.o.B"; }
	if ($string =~ /^CHERYL COLE$/) { return "CHERYL"; }
	if ($string =~ /^C AGUILERA$/) { return "Christina Aguilera"; }
	if ($string =~ /^DISCLOSURE$/) { return "The Disclosure"; }
	if ($string =~ /^DR DRE$/) { return "Dr. Dre"; }
	if ($string =~ /^DR KUCHO$/) { return "Dr. Kucho!"; }
	if ($string =~ /^ELVIS$/) { return "Elvis Presley"; }
	if ($string =~ /^FATBOYSLIM$/) { return "Fatboy Slim"; }
	if ($string =~ /^FUN$/) { return "Fun."; }
	if ($string =~ /^HEARSAY$/) { return "Hear`Say"; }
	if ($string =~ /^JAY-Z$/) { return "JAY Z"; }
	if ($string =~ /^KESHA$/) { return "Ke\$ha"; }
	if ($string =~ /^LUMINEERS$/) { return "The Lumineers"; }
	if ($string =~ /^KILLERS$/) { return "The Killers"; }
	if ($string =~ /^MAGIC$/) { return "MAGIC!"; }
	if ($string =~ /^MAGICIAN$/) { return "The Magician"; }
	if ($string =~ /^NOTORIOUS BIG$/) { return "The Notorious B.I.G."; }
	if ($string =~ /^OZZY$/) { return "Ozzy Osbourne"; }
	if ($string =~ /^PINK$/) { return "P!nk"; }
	if ($string =~ /^PSY$/) { return "싸이"; }
	if ($string =~ /^R KELLY$/) { return "R. Kelly"; }
	if ($string =~ /^SATURDAYS$/) { return "The Saturdays"; }
	if ($string =~ /^SCRIPT$/) { return "The Script"; }
	if ($string =~ /^S INGROSSO$/) { return "Sebastian Ingrosso"; }
	if ($string =~ /^SHAPESHIFTERS$/) { return "The Shapeshifters"; }
	if ($string =~ /^SOPHIE ELLIS BEXTOR$/) { return "Sophie Ellis-Bextor"; }
	if ($string =~ /^TATU$/) { return "t.A.T.u."; }
	if ($string =~ /^TI$/) { return "T.I."; }
	if ($string =~ /^TING TINGS$/) { return "The Ting Tings"; }
	if ($string =~ /^VAMPS$/) { return "The Vamps"; }
	if ($string =~ /^WANTED$/) { return "The Wanted"; }
	if ($string =~ /^WEEKND$/) { return "The Weeknd"; }
	if ($string =~ /^WILL I AM$/) { return "Will.I.Am"; }
	
	return $string;
}
