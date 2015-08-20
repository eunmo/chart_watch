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

my $rank = 1;
my $count = 1;

print "[";

my $url = sprintf("http://www.billboard-japan.com/charts/detail?a=hot100&year=%d&month=%02d&day=%02d",
									$ld->year(), $ld->month(), $ld->day());
my $html = get("$url");

my $dom = Mojo::DOM->new($html);

for my $div ($dom->find('td[class*="name_td"] p')->each) {
	my $title, $artist;
	my $title_norm, $artist_norm;

	if ($div->text) {
		$title = $div->text;
	} elsif ($div->find('a[href*=goods]')->first) {
		$title = $div->find('a[href*=goods]')->first->text;
	} else {
		next;
	}

	$title_norm = normalize_title($title);

	if ($div->find('span a')->first) {
		$artist = $div->find('span a')->first->text;
	} elsif ($div->find('span')->first) {
		$artist = $div->find('span')->first->text;
	}
		
	$artist_norm = normalize_artist($artist);

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

	if ($string =~ /^アイ・リアリー・ライク・ユー$/) { return "I Really Like You"; }

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
	$string =~ s/\"//g;
	$string =~ s/\sfeat\..*$//;
	$string =~ s/\swith\s.*$//;
	$string =~ s/\s+$//;
	$string =~ s/[\'’]/`/g;
	
	if ($string =~ /^カーリー・レイ・ジェプセン$/) { return "Carly Rae Jepsen"; }

	return $string;
}
