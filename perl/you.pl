use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use File::Slurp 'slurp';
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $date = $ARGV[0];

my $rank = 1;
my $count;

print "[";

for (my $i = 1; $i <= 2; $i++) {

	my $dom = Mojo::DOM->new(scalar slurp "$date-$i.html");
	my $odd = 1;
	my $artist, $title;

	for my $a ($dom->find('table[bgcolor="#C1C1C1"]')->first->find('a')->each) {
		if ($odd % 2) {
			$title = get_text($a->text);
		} else {
			$artist = normalize_artist(get_text($a->text));
			print ",\n" if $rank > 1;
			print "{ \"rank\": $rank, \"artist\": \"$artist\", \"titles\": [";
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
		$odd++;
	}
}

print "]";

sub get_text($)
{
	my $s = shift;

	$s = decode('shiftjis', $s);

	$s =~ tr/　！＂＃＄％＆＇（）＊＋，－．／/ !"#$%&'()*+,-.\//;
	$s =~ tr/０-９：；＜＝＞？＠Ａ-Ｚ［＼］＾/0-9:;<=>?@A-Z[\\]^/;
	$s =~ tr/＿｀ａ-ｚ｛｜｝￠￡￢￣￤￥￦/_`a-z{|}\¢£¬¯¦¥₩/;
	$s =~ tr/−/-/;

	return $s;
}

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
