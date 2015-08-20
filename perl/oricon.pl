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
								 ->add( weeks => 2);
my $ld_ymd = $ld->ymd();

my $rank = 1;
my $count = 1;

print "[";

for (my $i = 1; $i <= 5; $i++) {
	my $url = "http://www.oricon.co.jp/rank/js/w/$ld_ymd/p/$i/";
	my $html = get("$url");
	my $dom = Mojo::DOM->new($html);

	for my $div ($dom->find('section[class*="box-rank-entry"]')->each) {
		my $title_norm;
		if ($div->find('h2[class="title"]')->first) {
			my $title = $div->find('h2[class="title"]')->first->text;
			$title_norm = normalize_title($title);
		}
		my $artist_norm;
		if ($div->find('p[class="name"]')->first) {
			my $artist = $div->find('p[class="name"]')->first->text;
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
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\(.*\)//g;
	$string =~ s/\s+$//g;
	$string =~ s/^\s+$//g;
	$string =~ s/[\'’]/`/g;
	$string =~ s/\sfeat\..*$//;
	$string =~ s/\swith\s.*$//;
	$string =~ s/\\/¥/g;
	$string =~ s/-.*-//g;
	
	if ($string =~ /^胸キュン$/) { return "심쿵해"; }
	if ($string =~ /^SUMMER SPECIAL Pinocchio$/) { return "피노키오"; }

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^f\(x\)/) { return "f(x)"; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\/.*$//;
	$string =~ s/\sfeat\..*$//;
	$string =~ s/\swith\s.*$//;
	$string =~ s/\s+$//;
	$string =~ s/[\'’]/`/g;

	return $string;
}
