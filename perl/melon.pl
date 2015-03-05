use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $week = $ARGV[0];
my $year = $ARGV[1];

my $url = get_url();
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="wrap_song_info"]')->each) {
	my $title = $div->find('a')->first->text;
	my $artist = $div->find('div[class~="rank02"]')->first->find('a')->first->text;
	my $title_norm = normalize_title($title);
	my $artist_norm = normalize_artist($artist);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub first_day_of_week_old
{
	my ($year, $week) = @_;

	DateTime->new( year => $year, month => 1, day => 1 )
					->add( weeks => ($week - 1) )
					->truncate( to => 'week' )
					->subtract( days => 1);
}

sub last_day_of_week_old
{
	my ($year, $week) = @_;

	DateTime->new( year => $year, month => 1, day => 1 )
					->add( weeks => ($week - 1) )
					->truncate( to => 'week' )
					->add( days => 5 );
}

sub first_day_of_week_new
{
	my ($year, $week) = @_;

	DateTime->new( year => $year, month => 1, day => 1 )
					->add( weeks => ($week - 1) )
					->truncate( to => 'week' );
}

sub last_day_of_week_new
{
	my ($year, $week) = @_;

	DateTime->new( year => $year, month => 1, day => 1 )
					->add( weeks => ($week - 1) )
					->truncate( to => 'week' )
					->add( days => 6 );
}

sub get_url
{
	my $age = int($year / 10) * 10;
	my $fd, $ld;

	if ($year < 2012 || ($year == 2012 && $week <= 33)) {
		$fd = first_day_of_week_old($year, $week);
		$ld = last_day_of_week_old($year, $week);
	} else {
		$fd = first_day_of_week_new($year, $week);
		$ld = last_day_of_week_new($year, $week);
	}

	my $fd_ymd = $fd->ymd('');
	my $ld_ymd = $ld->ymd('');
	my $url = sprintf("http://www.melon.com/chart/search/list.htm?chartType=WE&age=%d&year=%d&mon=%02d&day=%d%%5E%d&classCd=DP0000&startDay=%d&endDay=%d&moved=Y", $age, $year, $ld->month(), $fd_ymd, $ld_ymd, $fd_ymd, $ld_ymd);
	print $url;

	return $url;
}

sub normalize_title($)
{
	my $string = shift;
	
	if ($string =~ /^Mr. Chu/) { return "Mr. Chu (On Stage)"; }

	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;
	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	if ($string =~ /^에이핑크/) { return "Apink"; }
	if ($string =~ /^비원에이포/) { return "B1A4"; }
	if ($string =~ /^크러쉬/) { return "Crush"; }
	if ($string =~ /^f\(x\)/) { return "f(x)"; }
	if ($string =~ /^G-Dragon/) { return "GD"; }
	if ($string =~ /^MC 몽/) { return "MC몽"; }
	if ($string =~ /^레드벨벳/) { return "Red Velvet"; }
	if ($string =~ /^산이/) { return "San E"; }
	if ($string =~ /^스윙스/) { return "Swings"; }
	if ($string =~ /^T.O.P/) { return "TOP"; }
	if ($string =~ /^유브이/) { return "UV"; }
	if ($string =~ /^위너/) { return "WINNER"; }
	if ($string =~ /^자이언티/) { return "Zion.T"; }
	if ($string =~ /^15&/) { return "15&"; }
	if ($string =~ /^마이티마우스/) { return "마이티 마우스"; }
	if ($string =~ /^브라운아이드걸스/) { return "브라운 아이드 걸스"; }
	if ($string =~ /^슈퍼주니어 예성/) { return "예성"; }
	if ($string =~ /^오렌지캬라멜/) { return "오렌지 캬라멜"; }
	if ($string =~ /^울랄라세션/) { return "울랄라 세션"; }
	if ($string =~ /^윤미래/) { return "윤미래"; }
	if ($string =~ /^존 박/) { return "존박"; }
	if ($string =~ /^소녀시대-태티서/) { return "태티서"; }
	if ($string =~ /^포미닛/) { return "4minute"; }

	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\s+$//;
	
	if ($string =~ /^바비$/) { return "BOBBY"; }
	if ($string =~ /^브로$/) { return "Bro"; }
	if ($string =~ /^Gary$/) { return "개리"; }

	return $string;
}
