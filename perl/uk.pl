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
	
	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	
	if ($string =~ /^GANGNAM STYLE$/) { return "강남스타일"; }
	if ($string =~ /^FOURFIVE SECONDS$/) { return "FOURFIVESECONDS"; }
	
	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^FLORENCE & THE MACHINE$/) { return $string; }
	if ($string =~ /^LILLY WOOD & ROBIN SCHULZ$/) { return "Lilly Wood & the Prick"; }
	if ($string =~ /^MUMFORD & SONS$/) { return $string; }
	if ($string =~ /^NICO & VINZ$/) { return $string; }
	if ($string =~ /^YEARS & YEARS$/) { return $string; }
	if ($string =~ /^AC\/DC$/) { return $string; }
	
	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\/.*$//;
	$string =~ s/\sFT\s.*$//;
	$string =~ s/\s+$//;

	if ($string =~ /^CHERYL COLE$/) { return "CHERYL"; }
	if ($string =~ /^JAY-Z$/) { return "JAY Z"; }
	if ($string =~ /^LUMINEERS$/) { return "The Lumineers"; }
	if ($string =~ /^MAGIC$/) { return "MAGIC!"; }
	if ($string =~ /^PSY$/) { return "싸이"; }
	if ($string =~ /^SCRIPT$/) { return "The Script"; }
	if ($string =~ /^WANTED$/) { return "The Wanted"; }
	if ($string =~ /^WEEKND$/) { return "The Weeknd"; }
	if ($string =~ /^WILL I AM$/) { return "Will.I.Am"; }
	
	return $string;
}
