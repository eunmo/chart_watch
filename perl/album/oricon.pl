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
my $count = 6;

my $od = DateTime->new( year => $yy, month => $mm, day => $dd );
my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( weeks => 2);
my $od_ymd = $od->ymd('');
my $ld_ymd = $ld->ymd('');

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

$count = 1 if $od_ymd < '20031122';

my $you_date = $ld->ymd(' ');

my $perl_dir = "/home/ubuntu/dev/chart_watch/perl/album";
chdir $perl_dir;

system "/bin/bash you.sh $you_date $count";
my $html_dir = "$perl_dir/html";

my $rank = 1;

print "[";

for (my $i = 1; $i <= $count; $i++) {

	my $dom = Mojo::DOM->new(scalar slurp "$html_dir/$ld_ymd-$i.html");
	my $odd = 1;
	my $artist, $title;
	
	for my $a ($dom->find('table[bgcolor="#C1C1C1"]')->first->find('a')->each) {
		if ($odd % 2) {
			$title = normalize_title(get_text($a->text));
		} else {
			$artist = normalize_artist(get_text($a->text));
			print ",\n" if $rank > 1;
			print "{ \"rank\": $rank, \"artist\": \"$artist\", \"title\" : \"$title\" }";
			$rank++;
		}
		$odd++;
	}
}

print "]";

system "rm $html_dir/$ld_ymd*";

sub get_text($)
{
	my $s = shift;

	$s = decode('shiftjis', $s);

	$s =~ tr/　！＂＃＄％＆＇（）＊＋，－．／/ !"#$%&'()*+,-.\//;
	$s =~ tr/０-９：；＜＝＞？＠Ａ-Ｚ［＼］＾/0-9:;<=>?@A-Z[\\]^/;
	$s =~ tr/＿｀ａ-ｚ｛｜｝￠￡￢￣￤￥￦/_`a-z{|}\¢£¬¯¦¥₩/;
	$s =~ tr/−/-/;

	# circle + number
	$s =~ s/�@/①/g;
	$s =~ s/�A/②/g;
	$s =~ s/�B/③/g;
	$s =~ s/�C/④/g;
	$s =~ s/�D/⑤/g;
	$s =~ s/�E/⑥/g;
	$s =~ s/�F/⑦/g;
	$s =~ s/�G/⑧/g;
	$s =~ s/�H/⑨/g;
	$s =~ s/�I/⑩/g;
	$s =~ s/�J/⑪/g;
	$s =~ s/�K/⑫/g;
	$s =~ s/�L/⑬/g;
	$s =~ s/�M/⑭/g;
	$s =~ s/�N/⑮/g;

	# roman numerics
	$s =~ s/�T/I/g;
	$s =~ s/�U/II/g;
	$s =~ s/�V/III/g;
	$s =~ s/�W/IV/g;
	$s =~ s/�X/V/g;
	$s =~ s/�Y/VI/g;
	$s =~ s/�Z/VII/g;
	$s =~ s/�\[/VIII/g;
	$s =~ s/�\\/IX/g;
	$s =~ s/�\]/X/g;

	# heart
	$s =~ s/■/♥/g;
	$s =~ s/�ｫ/♥/g;
	
	# delta
	$s =~ s/�凾c/⊿D/g;
	$s =~ s/�凵@/⊿ /g;
	$s =~ s/^�$/⊿/g;

	# what should I say
	$s =~ s/�煤n/∑\]/g;
	$s =~ s/�髞V/隆之/g;
	$s =~ s/��P/`P/g;
	$s =~ s/ever�/ever`/g;
	$s =~ s/�ｮ/₂/g;
	$s =~ s/�唐�/∮あ/g;
	$s =~ s/�揩ｽ/﨟た/g;

	# difficult kanji
	$s =~ s/�ｱ/﨑/g;
	$s =~ s/��/髙/g;
	$s =~ s/�`/蓜/g;
	$s =~ s/�~/神/g;

	return $s;
}

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
