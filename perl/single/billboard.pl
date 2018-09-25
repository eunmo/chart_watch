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
} elsif ($ld->year() == 2018) {
	$ld = $ld->subtract( weeks => 1 );
}

my $ld_ymd = $ld->ymd();

my $url = "https://www.billboard.com/charts/hot-100/$ld_ymd";
my $html = qx{curl --silent $url};
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

my $title = $dom->find('div[class="chart-number-one__title"]')->first->text;
my $artist = $dom->find('div[class="chart-number-one__artist"]')->first->all_text;
my $title_norm = normalize($title);
my $artist_norm = normalize($artist);
	
print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"titles\" : [\"$title_norm\"] }";
$rank++;

for my $div ($dom->find('div[class="chart-list-item__first-row"]')->each) {
	if ($div->find('div[class="chart-list-item__title"]')->first) {
		$title = $div->find('div[class="chart-list-item__title"]')->first->all_text;
		$title_norm = normalize($title);
	}
	
	if ($div->find('div[class="chart-list-item__artist"]')->first) {
		$artist = $div->find('div[class="chart-list-item__artist"]')->first->all_text;
		$artist_norm = normalize($artist);
	}

	print ",\n{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"titles\" : [\"$title_norm\"] }";
	$rank++;
}

print "]";

sub normalize($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"]/`/g;

	return $string;
}
