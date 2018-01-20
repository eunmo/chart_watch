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
								 ->add( weeks => 2)
								 ->add( days => 4 ); # need confirmation

if ($ld->ymd() =~ '2018-01-05') { #2018-01-03 (matches chart date 2017-12-23)
	$ld = $ld->subtract( days => 2 );
} elsif ($ld->year() >= 2018) {
	$ld = $ld->subtract( weeks => 1 );
}

my $ld_ymd = $ld->ymd();

my $url = "http://www.billboard.com/charts/billboard-200/$ld_ymd";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="row__title"]')->each) {
	my $title_norm;
	if ($div->find('h2')->first) {
		my $title = $div->find('h2')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist;
	if ($div->find('a[data-tracklabel="Artist Name"]')->first) {
		$artist = $div->find('a[data-tracklabel="Artist Name"]')->first->text;
	} elsif ($div->find('h3')->first) {
		$artist = $div->find('h3')->first->text;
	} elsif ($div->find('span[class="chart-row__artist"]')->first) {
	  $artist = $div->find('span[class="chart-row__artist"]')->first->text;
	}
	my $artist_norm = normalize_artist($artist);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\": \"$title_norm\" }";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"]/`/g;
	$string =~ s/\\/\//g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"]/`/g;
	
	return $string;
}
