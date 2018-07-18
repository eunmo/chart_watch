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
#my $html = get("$url");
my $browser = LWP::UserAgent->new();
my @chrome_like_headers = (
  'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
  'Accept-Language' => 'en-US,en;q=0.9,ja;q=0.8,ko;q=0.7',
  'Accept-Charset' => 'iso-8859-1,*,utf-8',
  'Accept-Encoding' => 'gzip, deflate, br',
  'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
	'Connection' => 'keep-alive',
	'Upgrade-Insecure-Requests' => 1,
	'Cookie' => 'SCOUTER=xtem39gaq7e39; PCID=14675479856998918986776; WMONID=gkvTQbFCj0d; charttutorial=true; POC=WP10',
);
my $response = $browser->get($url, @chrome_like_headers);
my $html = $response->decoded_content;
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

my $title = $dom->find('div[class="chart-number-one__title"]')->first->text;
my $artist = $dom->find('div[class="chart-number-one__artist"] a')->first->text;
my $title_norm = normalize_title($title);
my $artist_norm = normalize_artist($artist);
	
print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\": \"$title_norm\" }";
$rank++;

for my $div ($dom->find('div[class="chart-list-item__first-row"]')->each) {
	if ($div->find('div[class="chart-list-item__title"]')->first) {
		$title = $div->find('div[class="chart-list-item__title"]')->first->all_text;
		$title_norm = normalize_title($title);
	}
	
	if ($div->find('div[class="chart-list-item__artist"]')->first) {
		$artist = $div->find('div[class="chart-list-item__artist"]')->first->all_text;
		$artist_norm = normalize_artist($artist);
	}

	print ",\n{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\": \"$title_norm\" }";
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
