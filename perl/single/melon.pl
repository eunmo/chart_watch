use LWP;
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

my $url = get_url();

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

for my $div ($dom->find('div[class*="wrap_song_info"]')->each) {
	my $title_norm;
	if ($div->find('div[class~="rank01"]')->first->find('a')->first) {
		my $title = $div->find('div[class~="rank01"]')->first->find('a')->first->text;
		$title_norm = normalize_title($title);
	} else {
		my $title = $div->find('span[class~="fc_lgray"]')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('div[class~="rank02"]')->first->find('a')->first) {
		my $artist = $div->find('div[class~="rank02"]')->first->find('a')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"titles\" : [\"$title_norm\"] }";
	$rank++;
}

print "]";

sub first_day_of_week_old
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->subtract( days => 1);
}

sub last_day_of_week_old
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->add( days => 5 );
}

sub first_day_of_week_new
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' );
}

sub last_day_of_week_new
{
	DateTime->new( year => $yy, month => $mm, day => $dd )
					->truncate( to => 'week' )
					->add( days => 6 );
}

sub get_url
{
	my $fd, $ld;
	my $cd = 'DP0000';

	if ($yy < 2004 ||
			$yy == 2004 && ($mm < 11 || ($mm == 10 && $dd <= 21))) {
		$fd = first_day_of_week_old();
		$ld = last_day_of_week_old();
		$cd = 'KPOP';
	} elsif ($yy < 2007 ||
		 ($yy == 2007 && ($mm < 7 || ($mm == 7 && $dd <= 8)))) {
		$fd = first_day_of_week_new();
		$ld = last_day_of_week_new();
	} elsif ($yy == 2007 && $mm == 7 && $dd <= 14) {
		$fd = first_day_of_week_new();
		$ld = last_day_of_week_old();
	} elsif ($yy < 2012 ||
		   ($yy == 2012 && ($mm < 8 || ($mm == 8 && $dd <= 11)))) {
		$fd = first_day_of_week_old();
		$ld = last_day_of_week_old();
	} else {
		$fd = first_day_of_week_new();
		$ld = last_day_of_week_new();
	}

	if ($yy < 2008 ||
			$yy == 2008 && ($mm < 10 || ($mm == 10 && $dd <= 25))) {
		$cd = 'CL0000';
	} elsif ($yy >= 2018) {
		$cd = 'GN0000';
	}

	my $age = int($fd->year() / 10) * 10;
	my $fd_ymd = $fd->ymd('');
	my $ld_ymd = $ld->ymd('');
	my $url = sprintf("https://www.melon.com/chart/search/list.htm?chartType=WE&age=%d&year=%d&mon=%02d&day=%d%%5E%d&classCd=%s&startDay=%d&endDay=%d&moved=Y", $age, $yy, $ld->month(), $fd_ymd, $ld_ymd, $cd, $fd_ymd, $ld_ymd);

	return $url;
}

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'\"’]/`/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’]/`/g;

	return $string;
}
