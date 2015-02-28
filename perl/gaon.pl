use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
binmode(STDOUT, ":utf8");

my $week = $ARGV[0];
my $year = $ARGV[1];
my $week_string = sprintf("%02d", $week);

my $url = "http://www.gaonchart.co.kr/main/section/chart/online.gaon?nationGbn=T&serviceGbn=ALL&targetTime=$week_string&hitYear=$year&termGbn=week";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('td[class*="subject"]')->each) {
	my $title = $div->find('p')->first->text;
	my $artist = $div->find('p[class~="singer"]')->first->attr('title');
	my $title_norm = normalize_title($title);
	my $artist_norm = normalize_artist($artist);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/\'/`/g;
	return $string;
}

sub normalize_artist($)
{
	my $string = shift;

	if ($string =~ /^에이핑크/) { return "Apink"; }
	if ($string =~ /^바비/) { return "BOBBY"; }
	if ($string =~ /^f\(x\)/) { return "f(x)"; }
	if ($string =~ /^G-Dragon/) { return "GD"; }
	if ($string =~ /^MC 몽/) { return "MC몽"; }
	if ($string =~ /^T.O.P/) { return "TOP"; }
	if ($string =~ /^위너/) { return "WINNER"; }
	if ($string =~ /^자이언티/) { return "Zion.T"; }
	if ($string =~ /^15&/) { return "15&"; }
	if ($string =~ /^슈퍼주니어 예성/) { return "예성"; }
	if ($string =~ /^포미닛/) { return "4minute"; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&].*$//g;
	$string =~ s/\s+$//g;
	return $string;
}
