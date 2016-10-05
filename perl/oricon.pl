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

my $od = DateTime->new( year => $yy, month => $mm, day => $dd );
my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( weeks => 2);
my $od_ymd = $od->ymd('');
my $ld_ymd = $ld->ymd();

if ($od_ymd == '20000101' ||
	  $od_ymd == '20001230' ||
	  $od_ymd == '20011229' ||
	  $od_ymd == '20021228' ||
	  $od_ymd == '20031227' ||
	  $od_ymd == '20050101' ||
	  $od_ymd == '20051231' ||
	  $od_ymd == '20061230' ||
	  $od_ymd == '20071229' ||
	  $od_ymd == '20081227' ||
	  $od_ymd == '20100102') {
	print "[]";
	exit;
}

my $rank = 1;
my $count;

print "[";

for (my $i = 1; $i <= 5; $i++) {
	my $url = "http://www.oricon.co.jp/rank/js/w/$ld_ymd/p/$i/";
	my $html = get("$url");
	my $dom = Mojo::DOM->new($html);

	for my $div ($dom->find('section[class*="box-rank-entry"]')->each) {
		my $title;
		if ($div->find('h2[class="title"]')->first) {
			$title = $div->find('h2[class="title"]')->first->text;
		}
		my $artist_norm;
		if ($div->find('p[class="name"]')->first) {
			my $artist = $div->find('p[class="name"]')->first->text;
			$artist_norm = normalize_artist($artist);
		}
		print ",\n" if $rank > 1;
		print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"titles\": [";
		$count = 1;
		my @tokens = split(/\//, $title);
		foreach my $token (@tokens) {
			my $token_norm = normalize_title($token);
		  print ", " if $count > 1;	
			print "\"$token_norm\"";
			$count++;
		}
		print "]}";
		$rank++;
	}
}

print "]";

sub normalize_title($)
{
	my $string = shift;

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’]/`/g;
	$string =~ s/\\/¥/g;

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
