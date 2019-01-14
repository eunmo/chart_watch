use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use File::Slurp 'slurp';
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];

my $od = DateTime->new( year => $yy, month => $mm, day => $dd );
my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( weeks => 2);
my $od_ymd = $od->ymd('');
my $ld_ymd = $ld->ymd('-');

if ($od_ymd < '20181215') {
	print "[]";
	exit;
}

my $rank = 1;
my $pageCount = 5;

print "[";

for (my $i = 1; $i <= $pageCount; $i++) {

	my $url = "https://www.oricon.co.jp/rank/coa/w/$ld_ymd/";
	$url .= "p/$i/" if $i > 1;
	my $html = get($url);
	my $dom = Mojo::DOM->new($html);

	for my $div ($dom->find('section[class="box-rank-entry"] div[class="wrap-text"]')->each) {
		$title = $div->find('h2[class="title"]')->first->text;
		$artist = $div->find('p[class="name"]')->first->text;
		$title_norm = normalize_title($title);
		$artist_norm = normalize_artist($artist);
		
		print ",\n" if $rank > 1;
		print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\" }";
		$rank++;
	}
}

print "]";

sub normalize_title($)
{
	my $string = shift;

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`‘“”]/`/g;
	$string =~ s/\\/¥/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`‘“”]/`/g;

	return $string;
}
